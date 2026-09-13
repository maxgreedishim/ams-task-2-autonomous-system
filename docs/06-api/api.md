# HTTP API

Base URL: `http://localhost:4000`.

Контракт маршрутов соответствует минимальному API из PDF: `POST /tasks`, `GET /tasks/{task_id}`,
`GET /tasks/{task_id}/events`, а для направления B также `POST /confirm` и бонусный `POST /cancel`.

## `GET /health`

Ответ: `{ "ok": true }`.

## `POST /tasks`

```json
{
  "task_id": "optional-uuid",
  "workspace_id": "demo-a",
  "user_id": "user-7",
  "role": "operator",
  "goal": "Проверить записи",
  "context": {},
  "mode": "confirm",
  "limits": { "max_steps": 8, "max_tool_calls": 5, "max_runtime_seconds": 120 }
}
```

## Task endpoints

| Method | Route | Назначение |
|---|---|---|
| `GET` | `/tasks/:task_id` | состояние, plan, result и limits |
| `GET` | `/tasks/:task_id/events` | ordered audit |
| `POST` | `/tasks/:task_id/confirm` | подтвердить ожидающую запись |
| `POST` | `/tasks/:task_id/cancel` | отменить активную задачу |

## Tools

- `list_records(workspace_id, query)` — чтение текущего workspace;
- `get_record(workspace_id, record_id, fields)` — чтение только разрешённых полей;
-  `create_followup(workspace_id, request_workspace_id, record_id, title)` — mock-запись после
  policy/confirmation.