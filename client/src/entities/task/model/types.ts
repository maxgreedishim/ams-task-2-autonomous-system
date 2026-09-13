export type Mode = 'read_only' | 'confirm' | 'policy_automated';
export type TaskStatus = 'QUEUED' | 'PLANNING' | 'RUNNING' | 'WAITING_CONFIRMATION' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export const modeLabels: Record<Mode, string> = {
  read_only: 'Только чтение',
  confirm: 'С подтверждением',
  policy_automated: 'Автоматический',
};

export const toolLabels: Record<string, string> = {
  list_records: 'Поиск записей',
  get_record: 'Получение записи',
  create_followup: 'Создание последующего действия',
};

export const statusLabels: Record<TaskStatus, string> = {
  QUEUED: 'В очереди',
  PLANNING: 'Планирование',
  RUNNING: 'Выполняется',
  WAITING_CONFIRMATION: 'Ожидает подтверждения',
  COMPLETED: 'Завершена',
  FAILED: 'Не выполнено',
  CANCELLED: 'Отменена',
};

export const auditEventLabels: Record<string, string> = {
  TASK_CREATED: 'Задача создана',
  TASK_STATE_CHANGED: 'Состояние изменено',
  PLAN_CREATED: 'План создан',
  POLICY_CHECK: 'Проверка политики',
  TOOL_CALLED: 'Инструмент вызван',
  CONFIRMATION_ACCEPTED: 'Подтверждение принято',
  CONFIRMATION_REJECTED: 'Подтверждение отклонено',
};

export const auditDecisionLabels: Record<string, string> = {
  ACCEPTED: 'Принято',
  PLANNER_STARTED: 'Планирование начато',
  VALIDATED: 'Проверено',
  PLAN_VALIDATED: 'План проверен',
  ALLOWLIST_MATCH: 'Разрешено политикой',
  CONFIRMATION_REQUIRED: 'Требуется подтверждение',
  EXECUTED: 'Выполнено',
  ONE_TIME_ACCEPTED: 'Одноразово разрешено',
  WRITE_BLOCKED_IN_READ_ONLY: 'Запись заблокирована в режиме «Только чтение»',
  UNKNOWN_TOOL: 'Неизвестный инструмент',
  TOOL_CALL_LIMIT: 'Достигнут лимит вызовов инструментов',
  STEP_LIMIT: 'Достигнут лимит шагов',
  RUNTIME_LIMIT: 'Превышено максимальное время выполнения',
  WORKSPACE_BOUNDARY: 'Доступ к другой рабочей области запрещён',
  INVALID_TOOL_ARGS: 'Недопустимые аргументы инструмента',
  TOOL_EXECUTION_FAILED: 'Ошибка выполнения инструмента',
  PLAN_COMPLETE: 'План выполнен',
  CANCELLED_BY_USER: 'Отменено пользователем',
  ALREADY_PROCESSED: 'Уже обработано',
  CONFIRMATION_REJECTED: 'Подтверждение отклонено',
};

export const actorLabels: Record<string, string> = {
  system: 'система',
  planner: 'планировщик',
  policy: 'политика',
  gateway: 'шлюз инструментов',
  'user-7': 'оператор',
};

export interface Task {
  task_id: string;
  status: TaskStatus;
  goal: string;
  mode: Mode;
  steps: number;
  tool_calls: number;
  result: { last_tool?: string; output?: unknown; draft?: string } | null;
  plan: Array<{ tool: string; args: Record<string, unknown>; purpose: string }> | null;
  trace_id: string;
}

export interface AuditEvent { id: number; event_type: string; actor: string; decision: string; trace_id: string; payload: string; createdAt: string; }
