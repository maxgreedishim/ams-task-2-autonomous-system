# Context and boundaries

```text
Browser / demo UI
        ↓ HTTP
Express API
        ├── task-service
        ├── planner
        ├── policy
        ├── gateway
        ├── mock-system
        └── SQLite (tasks, events)
```

Внутри системы находятся planner, policy, gateway, task execution и SQLite. За границами остаются
реальная CRM, реальная аутентификация и LLM.

Planner не вызывает tools напрямую. Любой вызов проходит policy, затем gateway.

## Общая основа задания

Система реализует общий контракт автономной задачи из PDF:

```text
QUEUED → PLANNING → RUNNING → COMPLETED
                         ↘ WAITING_CONFIRMATION → RUNNING
Любое активное состояние → FAILED или CANCELLED
```

Задача и упорядоченный журнал событий сохраняются в SQLite и доступны через HTTP API после
перезапуска server.