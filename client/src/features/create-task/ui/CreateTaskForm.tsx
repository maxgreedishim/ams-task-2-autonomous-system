'use client';

import { useState } from 'react';
import { createTask, modeLabels, type Mode, type Task } from '@/entities/task';

export function CreateTaskForm({ onCreated }: { onCreated: (task: Task) => void }) {
  const [goal, setGoal] = useState('Проверить открытые записи и подготовить дальнейшее действие');
  const [mode, setMode] = useState<Mode>('confirm');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(''); try { onCreated(await createTask(goal, mode)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ошибка'); } finally { setBusy(false); } }
  return <form onSubmit={submit} className="form"><label>Цель<textarea value={goal} onChange={event => setGoal(event.target.value)} /></label><label>Режим<select value={mode} onChange={event => setMode(event.target.value as Mode)}><option value="read_only">{modeLabels.read_only}</option><option value="confirm">{modeLabels.confirm}</option><option value="policy_automated">{modeLabels.policy_automated}</option></select></label>{error && <p className="error">{error}</p>}<button disabled={busy || !goal.trim()}>{busy ? 'Выполняется…' : 'Создать задачу'}</button></form>;
}
