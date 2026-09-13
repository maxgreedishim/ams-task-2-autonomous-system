import crypto from 'node:crypto';
import { Event } from '../db.js';

export function hashInput(input: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

export async function audit(taskId: string, traceId: string, eventType: string, actor: string, input: unknown, decision: string, payload: unknown): Promise<void> {
  await Event.create({ task_id: taskId, event_type: eventType, actor, input_hash: hashInput(input), decision, trace_id: traceId, payload: JSON.stringify(payload) });
}
