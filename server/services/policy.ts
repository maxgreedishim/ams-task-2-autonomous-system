import { toolNames, type Mode, type PlanStep, type TaskLimits } from '../models/types.js';

export interface PolicyDecision { allowed: boolean; reason: string; needsConfirmation: boolean; }

const allowedFields = new Set(['title', 'status', 'owner']);

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every(key => keys.includes(key));
}

export function checkPolicy(mode: Mode, step: PlanStep, limits: TaskLimits, toolCalls: number, taskWorkspaceId?: string): PolicyDecision {
  if (!toolNames.includes(step.tool)) return { allowed: false, reason: 'UNKNOWN_TOOL', needsConfirmation: false };
  if (toolCalls >= limits.max_tool_calls) return { allowed: false, reason: 'TOOL_CALL_LIMIT', needsConfirmation: false };
  if (step.tool === 'create_followup' && mode === 'read_only') return { allowed: false, reason: 'WRITE_BLOCKED_IN_READ_ONLY', needsConfirmation: false };
  if (!step.args || typeof step.args.workspace_id !== 'string') return { allowed: false, reason: 'INVALID_TOOL_ARGS', needsConfirmation: false };
  if (taskWorkspaceId && step.args.workspace_id !== taskWorkspaceId) return { allowed: false, reason: 'WORKSPACE_BOUNDARY', needsConfirmation: false };
  if (step.tool === 'list_records' && (!hasOnlyKeys(step.args, ['workspace_id', 'query']) || typeof step.args.query !== 'string')) return { allowed: false, reason: 'INVALID_TOOL_ARGS', needsConfirmation: false };
  if (step.tool === 'get_record' && (!hasOnlyKeys(step.args, ['workspace_id', 'record_id', 'fields']) || typeof step.args.record_id !== 'string' || !Array.isArray(step.args.fields) || step.args.fields.length === 0 || step.args.fields.some(field => typeof field !== 'string' || !allowedFields.has(field)))) return { allowed: false, reason: 'INVALID_TOOL_ARGS', needsConfirmation: false };
  if (step.tool === 'create_followup' && (!hasOnlyKeys(step.args, ['workspace_id', 'request_workspace_id', 'record_id', 'title']) || typeof step.args.request_workspace_id !== 'string' || typeof step.args.record_id !== 'string' || typeof step.args.title !== 'string' || step.args.title.trim() === '')) return { allowed: false, reason: 'INVALID_TOOL_ARGS', needsConfirmation: false };
  if (step.tool === 'create_followup' && step.args.request_workspace_id !== step.args.workspace_id) return { allowed: false, reason: 'WORKSPACE_BOUNDARY', needsConfirmation: false };
  if (step.tool === 'create_followup' && mode === 'confirm') return { allowed: true, reason: 'CONFIRMATION_REQUIRED', needsConfirmation: true };
  return { allowed: true, reason: 'ALLOWLIST_MATCH', needsConfirmation: false };
}
