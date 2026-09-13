import type { AuditEvent, Mode, Task } from './model/types';
import { requestJson } from '@/shared/api/http';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000';

export function createTask(goal: string, mode: Mode): Promise<Task> {
  return requestJson<Task>(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspace_id: 'demo-a', user_id: 'user-7', role: 'operator', goal, mode, limits: { max_steps: 8, max_tool_calls: 5, max_runtime_seconds: 120 } }),
  });
}

export function confirmTask(taskId: string): Promise<Task> {
  return requestJson<Task>(`${API_URL}/tasks/${taskId}/confirm`, { method: 'POST' });
}

export function getEvents(taskId: string): Promise<AuditEvent[]> {
  return requestJson<AuditEvent[]>(`${API_URL}/tasks/${taskId}/events`);
}
