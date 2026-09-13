'use client';

import { useEffect, useState } from 'react';
import { actorLabels, auditDecisionLabels, auditEventLabels, statusLabels, toolLabels, type AuditEvent, type Task } from '@/entities/task';
import { ConfirmFollowup } from '@/features/confirm-followup';
import { getEvents } from '@/entities/task';

export function TaskStatusCard({ initialTask, onTaskChanged }: { initialTask: Task; onTaskChanged: (task: Task) => void }) {
  const [task, setTask] = useState(initialTask);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  function updateTask(nextTask: Task) { setTask(nextTask); onTaskChanged(nextTask); }
  const blockedByPolicy = task.status === 'FAILED' && events.some(event => event.decision === 'WRITE_BLOCKED_IN_READ_ONLY');
  const visibleStatus = blockedByPolicy ? 'Завершено безопасно' : statusLabels[task.status];
  useEffect(() => {
    let active = true;
    void getEvents(task.task_id).then(nextEvents => {
      if (active) setEvents(nextEvents);
    });
    return () => { active = false; };
  }, [task.task_id, task.status]);
  return <section className="task-column"><div className="task-head"><div><span className="eyebrow">Идентификатор задачи: {task.task_id}</span><div className="status-line"><span className={`status-dot status-${task.status.toLowerCase()}`} /><h2>{visibleStatus}</h2></div>{blockedByPolicy && <p className="status-explanation">Запись заблокирована политикой режима «Только чтение».</p>}</div><span className="trace">Идентификатор трассировки: {task.trace_id}</span></div>{task.status === 'WAITING_CONFIRMATION' && <div className="confirmation-box"><div><b>Требуется подтверждение</b><p>Будет выполнено «Создание последующего действия» (`create_followup`) с аргументами из плана.</p></div><ConfirmFollowup taskId={task.task_id} onConfirmed={updateTask} /></div>}<div className="data-grid"><section className="data-card"><div className="card-heading"><h3>План выполнения</h3><span>{task.plan?.length ?? 0} шага</span></div>{task.plan ? <div className="plan-list">{task.plan.map((step, index) => <div className="plan-step" key={`${step.tool}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{toolLabels[step.tool] ?? step.tool} <small>({step.tool})</small></b><small>{step.purpose}</small><code>{JSON.stringify(step.args)}</code></div></div>)}</div> : <p className="muted">План ещё строится.</p>}</section><section className="data-card"><div className="card-heading"><h3>Последний результат</h3><span>{task.result ? 'готов' : 'нет данных'}</span></div>{task.result ? <pre>{JSON.stringify(task.result, null, 2)}</pre> : <p className="muted">Результат появится после вызова инструмента.</p>}</section></div><section className="audit-card"><div className="card-heading"><h3>Аудит · журнал действий</h3><span>{events.length} событий</span></div>{events.length > 0 ? <ol className="events">{events.map(event => <li key={event.id}><span className="event-marker" /><div><b>{auditEventLabels[event.event_type] ?? event.event_type}</b><span>{auditDecisionLabels[event.decision] ?? event.decision} · {actorLabels[event.actor] ?? event.actor}</span></div></li>)}</ol> : <p className="muted">События появятся после создания задачи.</p>}</section></section>;
}
