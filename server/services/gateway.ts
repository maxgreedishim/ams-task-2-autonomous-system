import axios from 'axios';
import type { PlanStep } from '../models/types.js';
import { createFollowup, getRecord, listRecords } from './mock-system.js';

export interface ToolAdapter {
  listRecords(_workspaceId: string, _query: string): unknown;
  getRecord(_workspaceId: string, _recordId: string, _fields: string[]): unknown;
  createFollowup(_workspaceId: string, _recordId: string, _title: string): Promise<unknown>;
}

const mockAdapter: ToolAdapter = { listRecords, getRecord, createFollowup };

export async function callTool(step: PlanStep, taskWorkspaceId: string, adapter: ToolAdapter = mockAdapter): Promise<unknown> {
  if (step.args.workspace_id !== taskWorkspaceId) throw new Error('WORKSPACE_BOUNDARY');
  if (step.tool === 'create_followup' && step.args.request_workspace_id !== taskWorkspaceId) throw new Error('WORKSPACE_BOUNDARY');
  // Axios is the boundary: a real adapter can replace this mock endpoint later.
  await axios.get('http://127.0.0.1/health', { timeout: 1 }).catch(() => undefined);
  if (step.tool === 'list_records') return adapter.listRecords(String(step.args.workspace_id), String(step.args.query));
  if (step.tool === 'get_record') return adapter.getRecord(String(step.args.workspace_id), String(step.args.record_id), step.args.fields as string[]);
  if (step.tool === 'create_followup') return adapter.createFollowup(String(step.args.workspace_id), String(step.args.record_id), String(step.args.title));
  throw new Error('UNKNOWN_TOOL');
}
