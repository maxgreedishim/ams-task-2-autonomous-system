export type Mode = 'read_only' | 'confirm' | 'policy_automated';
export type TaskStatus = 'QUEUED' | 'PLANNING' | 'RUNNING' | 'WAITING_CONFIRMATION' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ToolName = 'list_records' | 'get_record' | 'create_followup';

export interface TaskLimits {
  max_steps: number;
  max_tool_calls: number;
  max_runtime_seconds: number;
}

export interface CreateTaskInput {
  task_id?: string;
  workspace_id: string;
  user_id: string;
  role: string;
  goal: string;
  context?: Record<string, unknown>;
  mode: Mode;
  limits?: Partial<TaskLimits>;
}

export interface PlanStep {
  tool: ToolName;
  args: Record<string, unknown>;
  purpose: string;
}

export const toolNames: readonly ToolName[] = ['list_records', 'get_record', 'create_followup'];

export const defaultLimits: TaskLimits = { max_steps: 8, max_tool_calls: 5, max_runtime_seconds: 120 };
