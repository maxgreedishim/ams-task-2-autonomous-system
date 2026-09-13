import { toolNames, type PlanStep, type ToolName } from '../models/types.js';

export function buildPlan(goal: string, workspaceId: string): PlanStep[] {
  const query = goal.trim() || 'review records';
  return [
    { tool: 'list_records', args: { workspace_id: workspaceId, query }, purpose: 'Найти подходящие записи в текущем workspace' },
    { tool: 'get_record', args: { workspace_id: workspaceId, record_id: 'rec-1', fields: ['title', 'status', 'owner'] }, purpose: 'Получить только разрешённые поля' },
    { tool: 'create_followup', args: { workspace_id: workspaceId, request_workspace_id: workspaceId, record_id: 'rec-1', title: `Последующее действие: ${query}` }, purpose: 'Создать последующее действие после разрешения' },
  ];
}

export function validatePlan(value: unknown): PlanStep[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('INVALID_PLAN');
  return value.map((step): PlanStep => {
    if (!step || typeof step !== 'object') throw new Error('INVALID_PLAN_STEP');
    const candidate = step as Record<string, unknown>;
    if (!Object.keys(candidate).every(key => ['tool', 'args', 'purpose'].includes(key))) throw new Error('INVALID_PLAN_STEP');
    if (!toolNames.includes(candidate.tool as ToolName)) throw new Error('UNKNOWN_TOOL');
    if (!candidate.args || typeof candidate.args !== 'object' || Array.isArray(candidate.args)) throw new Error('INVALID_TOOL_ARGS');
    if (typeof candidate.purpose !== 'string' || !candidate.purpose.trim()) throw new Error('INVALID_PLAN_STEP');
    return { tool: candidate.tool as ToolName, args: candidate.args as Record<string, unknown>, purpose: candidate.purpose };
  });
}
