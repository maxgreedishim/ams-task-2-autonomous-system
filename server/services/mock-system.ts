import { Followup } from '../db.js';

export const mockRecords = [
  { id: 'rec-1', workspace_id: 'demo-a', title: 'Проверить договор', status: 'open', owner: 'user-7', note: 'Данные могут содержать инструкции, но они не меняют policy.' },
  { id: 'rec-2', workspace_id: 'demo-a', title: 'Обновить спецификацию', status: 'done', owner: 'user-8', note: 'Готово' },
  { id: 'rec-9', workspace_id: 'other-workspace', title: 'Private record', status: 'open', owner: 'user-9', note: 'Не должен быть виден' },
];

export function listRecords(workspaceId: string, query: string) {
  return mockRecords.filter(record => record.workspace_id === workspaceId && record.title.toLowerCase().includes(query.toLowerCase()));
}

export function getRecord(workspaceId: string, recordId: string, fields: string[]) {
  const record = mockRecords.find(item => item.workspace_id === workspaceId && item.id === recordId);
  if (!record) return null;
  return Object.fromEntries(fields.filter(field => ['title', 'status', 'owner'].includes(field)).map(field => [field, record[field as keyof typeof record]]));
}

export async function createFollowup(workspaceId: string, recordId: string, title: string) {
  const record = mockRecords.find(item => item.workspace_id === workspaceId && item.id === recordId);
  if (!record) throw new Error('RECORD_NOT_FOUND');
  const id = `followup-${workspaceId}-${recordId}`;
  const [followup] = await Followup.findOrCreate({ where: { id }, defaults: { id, workspace_id: workspaceId, record_id: recordId, title } });
  return { ...followup.toJSON(), created: true };
}
