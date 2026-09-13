# Scope

## In scope

- создание и идемпотентное повторное получение task;
- режимы `read_only`, `confirm`, `policy_automated`;
- инструменты чтения и mock-записи;
- одноразовое подтверждение и cancel;
- workspace-проверки и allowlist полей;
- лимиты steps, tool calls и runtime;
- SQLite persistence и audit;
- Next.js demo UI и Docker Compose.

## Out of scope

- реальная LLM;
- реальная CRM-запись;
- полноценная пользовательская аутентификация;
- отдельная таблица follow-up;
- production deployment и distributed execution.