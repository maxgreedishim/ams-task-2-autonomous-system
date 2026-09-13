# Acceptance traceability

Приёмка ориентируется на PDF-задание 2, направление B. Тесты ниже — ровно три обязательных
автоматических теста: основной сценарий, безопасный отказ и защита от дубля.

Ровно три backend-теста находятся в `server/test/core.test.ts`:

| Тест | Проверяет |
|---|---|
| `read_only blocks a write before gateway execution` | safe refusal, unknown tool, invalid fields |
| `confirm mode waits for one explicit confirmation` | main flow, completion, one-time confirmation |
| `reusing task_id returns the existing task and does not duplicate it` | task idempotency, scope mismatch, limits, concurrent confirm, cancel |

Команды проверки:

```bash
npm run fsd:check
npm run typecheck
npm run lint
npm test
```