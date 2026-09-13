import crypto from 'node:crypto';
import { clearTimeout, setTimeout } from 'node:timers';
import { Task, Event } from '../db.js';
import { audit } from '../utils/audit.js';
import { checkPolicy } from './policy.js';
import { buildPlan, validatePlan } from './planner.js';
import { callTool } from './gateway.js';
import type { CreateTaskInput, PlanStep, TaskLimits } from '../models/types.js';
import { defaultLimits } from '../models/types.js';

const publicTask = (task: Task) => ({ ...task.toJSON(), context: JSON.parse(task.context), limits: JSON.parse(task.limits), plan: task.plan ? JSON.parse(task.plan) : null, result: task.result ? JSON.parse(task.result) : null });

async function withDeadline<T>(operation: Promise<T>, deadline: number): Promise<T> {
  const remaining = Math.max(1, deadline - Date.now());
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('RUNTIME_LIMIT')), remaining); }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

async function transition(task: Task, status: Task['status'], decision: string): Promise<void> {
  task.status = status;
  await task.save();
  await audit(task.task_id, task.trace_id, 'TASK_STATE_CHANGED', 'system', { status }, decision, { status });
}

async function execute(task: Task, plan: PlanStep[], startIndex: number, confirmed = false): Promise<void> {
  const limits = JSON.parse(task.limits) as TaskLimits;
  const deadline = task.createdAt.getTime() + limits.max_runtime_seconds * 1000;
  const failIfExpired = async (): Promise<boolean> => {
    if (Date.now() < deadline) return false;
    await transition(task, 'FAILED', 'RUNTIME_LIMIT');
    return true;
  };
  for (let index = startIndex; index < plan.length; index += 1) {
    if (task.status === 'CANCELLED' || await failIfExpired()) return;
    if (task.steps >= limits.max_steps) { await transition(task, 'FAILED', 'STEP_LIMIT'); return; }
    const step = plan[index];
    const decision = checkPolicy(task.mode, step, limits, task.tool_calls, task.workspace_id);
    await audit(task.task_id, task.trace_id, 'POLICY_CHECK', 'policy', step, decision.reason, { tool: step.tool });
    if (!decision.allowed) { await transition(task, 'FAILED', decision.reason); return; }
    if (decision.needsConfirmation && !confirmed) {
      task.plan = JSON.stringify(plan.map((item, i) => ({ ...item, index: i })));
      await transition(task, 'WAITING_CONFIRMATION', decision.reason);
      return;
    }
    let output: unknown;
    try {
      output = await withDeadline(callTool(step, task.workspace_id), deadline);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'TOOL_EXECUTION_FAILED';
      await transition(task, 'FAILED', reason);
      return;
    }
    const current = await Task.findByPk(task.task_id);
    if (!current || current.status === 'CANCELLED') return;
    task.tool_calls += 1;
    task.steps += 1;
    task.result = JSON.stringify({ last_tool: step.tool, output, draft: index === 1 ? 'Готов черновик follow-up' : undefined });
    await task.save();
    await audit(task.task_id, task.trace_id, 'TOOL_CALLED', 'gateway', step, 'EXECUTED', { tool: step.tool, output_type: typeof output });
  }
  await transition(task, 'COMPLETED', 'PLAN_COMPLETE');
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  if (!input || typeof input !== 'object' || !input.workspace_id || !input.user_id || !input.role || !input.goal || !input.mode) throw new Error('INVALID_TASK_INPUT');
  if (!['read_only', 'confirm', 'policy_automated'].includes(input.mode)) throw new Error('INVALID_MODE');
  const taskId = input.task_id ?? crypto.randomUUID();
  const existing = await Task.findByPk(taskId);
  if (existing) {
    if (existing.workspace_id !== input.workspace_id || existing.user_id !== input.user_id || existing.role !== input.role) {
      throw new Error('TASK_ID_SCOPE_MISMATCH');
    }
    return existing;
  }
  const traceId = crypto.randomUUID();
  const limits = { ...defaultLimits, ...input.limits };
  if (![limits.max_steps, limits.max_tool_calls, limits.max_runtime_seconds].every(value => Number.isInteger(value) && value > 0)) throw new Error('INVALID_LIMITS');
  let task: Task;
  try {
    task = await Task.create({ task_id: taskId, workspace_id: input.workspace_id, user_id: input.user_id, role: input.role, goal: input.goal, context: JSON.stringify(input.context ?? {}), mode: input.mode, status: 'QUEUED', result: null, plan: null, limits: JSON.stringify(limits), tool_calls: 0, steps: 0, trace_id: traceId });
  } catch (error) {
    const duplicate = await Task.findByPk(taskId);
    if (duplicate) return duplicate;
    throw error;
  }
  await audit(taskId, traceId, 'TASK_CREATED', input.user_id, input, 'ACCEPTED', { mode: input.mode });
  await transition(task, 'PLANNING', 'PLANNER_STARTED');
  const plan = validatePlan(buildPlan(input.goal, input.workspace_id));
  task.plan = JSON.stringify(plan);
  await task.save();
  await audit(taskId, traceId, 'PLAN_CREATED', 'planner', { goal: input.goal }, 'VALIDATED', { steps: plan.length });
  await transition(task, 'RUNNING', 'PLAN_VALIDATED');
  await execute(task, plan, 0);
  return task;
}

export async function cancelTask(taskId: string): Promise<Task | null> {
  const [cancelled] = await Task.update({ status: 'CANCELLED' }, { where: { task_id: taskId, status: ['QUEUED', 'PLANNING', 'RUNNING', 'WAITING_CONFIRMATION'] } });
  const task = await Task.findByPk(taskId);
  if (!task) return null;
  if (cancelled === 1) await audit(task.task_id, task.trace_id, 'TASK_STATE_CHANGED', 'system', { status: 'CANCELLED' }, 'CANCELLED_BY_USER', { status: 'CANCELLED' });
  return task;
}

export async function confirmTask(taskId: string): Promise<Task | null> {
  const task = await Task.findByPk(taskId);
  if (!task) return null;
  if (task.status !== 'WAITING_CONFIRMATION') {
    await audit(task.task_id, task.trace_id, 'CONFIRMATION_REJECTED', 'system', { taskId }, 'ALREADY_PROCESSED', { status: task.status });
    return task;
  }
  const plan = JSON.parse(task.plan ?? '[]') as Array<PlanStep & { index: number }>;
  const step = plan.find(item => item.tool === 'create_followup');
  if (!step) { await transition(task, 'FAILED', 'CONFIRMATION_TARGET_MISSING'); return task; }
  const decision = checkPolicy(task.mode, step, JSON.parse(task.limits), task.tool_calls, task.workspace_id);
  if (!decision.allowed || !decision.needsConfirmation) { await transition(task, 'FAILED', 'CONFIRMATION_REJECTED'); return task; }
  const [claimed] = await Task.update({ status: 'RUNNING' }, { where: { task_id: taskId, status: 'WAITING_CONFIRMATION' } });
  if (claimed !== 1) return Task.findByPk(taskId);
  await audit(taskId, task.trace_id, 'CONFIRMATION_ACCEPTED', task.user_id, { taskId }, 'ONE_TIME_ACCEPTED', { tool: step.tool });
  task.status = 'RUNNING';
  await audit(task.task_id, task.trace_id, 'TASK_STATE_CHANGED', 'system', { status: 'RUNNING' }, 'CONFIRMATION_ACCEPTED', { status: 'RUNNING' });
  await execute(task, [step], 0, true);
  return task;
}

export async function getTask(taskId: string) { const task = await Task.findByPk(taskId); return task ? publicTask(task) : null; }
export async function getEvents(taskId: string) { return (await Event.findAll({ where: { task_id: taskId }, order: [['id', 'ASC']] })).map(event => event.toJSON()); }
