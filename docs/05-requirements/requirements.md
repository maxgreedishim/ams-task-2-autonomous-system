# Requirements

Требования ниже сведены из разделов PDF «Общая основа», «Направление B» и «Инженерный контур».
Бонусные возможности не выдаются за обязательные.

| ID | Требование | Реализация |
|---|---|---|
| B-001 | Запись в `read_only` блокируется до gateway | `services/policy.ts` |
| B-002 | `confirm` показывает ожидающее действие | `task-service.ts`, `plan` |
| B-003 | Подтверждение одноразовое | conditional update `WAITING_CONFIRMATION → RUNNING` |
| B-004 | Workspace ограничивает tool args | policy и gateway |
| B-005 | `get_record` разрешает только `title`, `status`, `owner` | policy allowlist |
| B-006 | Неизвестный tool отклоняется | planner validation и policy |
| B-007 | Output не меняет policy | output не используется как policy input |
| B-008 | Лимиты реально останавливают execution | checks перед каждым действием |
| B-009 | Tasks и events сохраняются | SQLite + Sequelize |
| B-010 | Повторный task id не создаёт дубль | idempotency и scope-check |

## Обязательные сценарии PDF

- запись в `read_only` блокируется до вызова инструмента;
- запись в `confirm` переводит задачу в `WAITING_CONFIRMATION`, а точный tool и args видны
  пользователю;
- второе подтверждение безопасно отклоняется и не создаёт второе действие;
- неизвестный инструмент отклоняется gateway/validation до исполнения;
- данные другого workspace не возвращаются и не изменяются;
- tool output с инструкцией не меняет policy;
- минимум один лимит реально останавливает выполнение;
- cancel не позволяет задаче завершиться как `COMPLETED`.
