# Data model

## `tasks`

Хранит `task_id`, workspace/user/role, goal, context, mode, status, plan, result, limits,
`tool_calls`, `steps`, `trace_id`, `createdAt`, `updatedAt`.

## `events`

Хранит ordered audit-журнал: numeric id, task id, event type, actor, input hash, decision, trace id,
payload и timestamps.

Схема создаётся автоматически через `sequelize.sync()` при запуске. В Compose SQLite хранится в
volume `server_data`.