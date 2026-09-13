import assert from 'node:assert/strict';
import { test, before } from 'node:test';

process.env.DB_PATH = ':memory:';
const { checkPolicy } = await import('../services/policy.js');
const { createTask, confirmTask, cancelTask, getEvents } = await import('../services/task-service.js');
const { initDb, Followup } = await import('../db.js');

before(async () => { await initDb(); });

test('read_only blocks a write before gateway execution', () => {
  const decision = checkPolicy('read_only', { tool: 'create_followup', args: {}, purpose: 'write' }, { max_steps: 8, max_tool_calls: 5, max_runtime_seconds: 120 }, 0);
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, 'WRITE_BLOCKED_IN_READ_ONLY');
  const unknown = checkPolicy('policy_automated', { tool: 'unknown_tool' as never, args: { workspace_id: 'demo-a' }, purpose: 'bad' }, { max_steps: 8, max_tool_calls: 5, max_runtime_seconds: 120 }, 0);
  assert.equal(unknown.allowed, false);
  assert.equal(unknown.reason, 'UNKNOWN_TOOL');
  const invalidFields = checkPolicy('read_only', { tool: 'get_record', args: { workspace_id: 'demo-a', record_id: 'rec-1', fields: ['note'] }, purpose: 'bad fields' }, { max_steps: 8, max_tool_calls: 5, max_runtime_seconds: 120 }, 0, 'demo-a');
  assert.equal(invalidFields.reason, 'INVALID_TOOL_ARGS');
});

test('confirm mode waits for one explicit confirmation', async () => {
  const task = await createTask({ workspace_id: 'demo-a', user_id: 'user-7', role: 'operator', goal: 'Проверить записи', mode: 'confirm' });
  assert.equal(task.status, 'WAITING_CONFIRMATION');
  const confirmed = await confirmTask(task.task_id);
  assert.equal(confirmed?.status, 'COMPLETED');
  assert.equal(confirmed?.steps, 3);
  assert.equal(confirmed?.tool_calls, 3);
  const followup = await Followup.findByPk('followup-demo-a-rec-1');
  assert.equal(followup?.workspace_id, 'demo-a');
  assert.equal(followup?.record_id, 'rec-1');
  const eventsAfterFirstConfirmation = (await getEvents(task.task_id)).length;
  const repeated = await confirmTask(task.task_id);
  assert.equal(repeated?.status, 'COMPLETED');
  assert.equal((await getEvents(task.task_id)).filter(event => event.event_type === 'TOOL_CALLED' && event.payload.includes('create_followup')).length, 1);
  assert.equal((await Followup.findAll({ where: { id: 'followup-demo-a-rec-1' } })).length, 1);
  assert.equal((await getEvents(task.task_id)).length, eventsAfterFirstConfirmation + 1);
});

test('reusing task_id returns the existing task and does not duplicate it', async () => {
  const taskId = 'fixed-demo-task';
  const first = await createTask({ task_id: taskId, workspace_id: 'demo-a', user_id: 'user-7', role: 'operator', goal: 'Список записей', mode: 'read_only' });
  const second = await createTask({ task_id: taskId, workspace_id: 'demo-a', user_id: 'user-7', role: 'operator', goal: 'Другая цель', mode: 'read_only' });
  assert.equal(second.task_id, first.task_id);
  assert.equal(second.trace_id, first.trace_id);
  assert.equal((await getEvents(taskId)).filter(event => event.event_type === 'TASK_CREATED').length, 1);
  await assert.rejects(
    () => createTask({ task_id: taskId, workspace_id: 'other-workspace', user_id: 'user-9', role: 'operator', goal: 'Чужая цель', mode: 'read_only' }),
    /TASK_ID_SCOPE_MISMATCH/,
  );

  const limited = await createTask({ task_id: 'limited-demo-task', workspace_id: 'demo-a', user_id: 'user-7', role: 'operator', goal: 'Лимит', mode: 'read_only', limits: { max_tool_calls: 1 } });
  assert.equal(limited.status, 'FAILED');
  assert.equal(limited.tool_calls, 1);

  const concurrent = await createTask({ task_id: 'concurrent-demo-task', workspace_id: 'demo-a', user_id: 'user-7', role: 'operator', goal: 'Гонка', mode: 'confirm' });
  await Promise.all([confirmTask(concurrent.task_id), confirmTask(concurrent.task_id)]);
  const concurrentEvents = await getEvents(concurrent.task_id);
  assert.equal(concurrentEvents.filter(event => event.event_type === 'CONFIRMATION_ACCEPTED').length, 1);
  assert.equal(concurrentEvents.filter(event => event.event_type === 'TOOL_CALLED' && event.payload.includes('create_followup')).length, 1);

  const cancelled = await createTask({ task_id: 'cancelled-demo-task', workspace_id: 'demo-a', user_id: 'user-7', role: 'operator', goal: 'Отмена', mode: 'confirm' });
  assert.equal((await cancelTask(cancelled.task_id))?.status, 'CANCELLED');
  assert.equal((await confirmTask(cancelled.task_id))?.status, 'CANCELLED');
});
