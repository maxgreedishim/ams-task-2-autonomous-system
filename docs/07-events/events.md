# Events and audit

Каждое событие содержит `task_id`, `event_type`, `actor`, `input_hash`, `decision`, `trace_id`,
`payload`, timestamp.

Основные события:

- `TASK_CREATED`;
- `TASK_STATE_CHANGED`;
- `PLAN_CREATED`;
- `POLICY_CHECK`;
- `CONFIRMATION_ACCEPTED`;
- `TOOL_CALLED`.

Секреты и полный чувствительный input в audit не сохраняются: для input используется SHA-256 hash,
payload содержит только минимальные сведения.