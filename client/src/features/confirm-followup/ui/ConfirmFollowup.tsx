'use client';

import { useState } from 'react';
import { confirmTask, type Task } from '@/entities/task';

export function ConfirmFollowup({ taskId, onConfirmed }: { taskId: string; onConfirmed: (task: Task) => void }) {
  const [error, setError] = useState('');
  async function confirm() {
    try {
      setError('');
      onConfirmed(await confirmTask(taskId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ошибка подтверждения');
    }
  }
  return <>{<button onClick={confirm}>Подтвердить создание действия</button>}{error && <p className="error">{error}</p>}</>;
}
