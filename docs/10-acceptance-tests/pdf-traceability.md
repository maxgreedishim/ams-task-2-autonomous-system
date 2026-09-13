# PDF traceability matrix

Источник: `/Users/max/Downloads/AMS_задание_2_автономная_система.pdf`, направление B «Управляемые
действия».

Статусы:

- **PASS** — подтверждено кодом и/или фактическим тестом;
- **PARTIAL** — основа есть, но есть явно описанное ограничение;
- **BONUS** — необязательное требование PDF;
- **N/A** — материал сдачи, не проверяется runtime-кодом.

## Общая основа

| Требование PDF | Статус | Evidence |
|---|---|---|
| API `POST /tasks` | PASS | `server/routes/taskRoutes.ts` |
| `GET /tasks/{task_id}` | PASS | `server/routes/taskRoutes.ts` |
| `GET /tasks/{task_id}/events` | PASS | `server/routes/taskRoutes.ts` |
| `POST /tasks/{task_id}/confirm` для B/C | PASS | `server/routes/taskRoutes.ts` |
| `POST /tasks/{task_id}/cancel` | PASS | `server/routes/taskRoutes.ts` |
| Task state machine | PASS | `server/services/task-service.ts` |
| Tasks/events сохраняются после рестарта | PASS | SQLite volume + HTTP restart check |
| Повторный `task_id` не создаёт дубль | PASS | `server/test/core.test.ts` |
| Минимум один лимит реально останавливает execution | PASS | max steps/tool calls test |
| Planner не вызывает tools напрямую | PASS | planner → policy → gateway |
| Значимые переходы имеют audit metadata | PASS | `server/utils/audit.ts` |
| Секреты и полный чувствительный input не попадают в audit | PASS | hash input + minimal payload |

## Направление B

| Требование PDF | Статус | Evidence |
|---|---|---|
| `list_records` только текущий workspace | PASS | policy, gateway, mock-system |
| `get_record` только разрешённые поля | PASS | allowlist `title/status/owner` |
| `create_followup` только после разрешения | PASS | read_only block / confirm gate |
| `read_only` блокирует запись до gateway | PASS | test + HTTP demo |
| `confirm` показывает `WAITING_CONFIRMATION` | PASS | plan contains exact tool and args |
| Аргументы ожидающего действия видны пользователю | PASS | UI раскрывает plan |
| Подтверждение выполняет запись | PASS | gateway returns created mock result |
| Повторное подтверждение не создаёт второе действие | PASS | one-time state claim + test |
| `policy_automated` allowlist policy | BONUS/PARTIAL | режим поддержан, основной demo использует `confirm` |
| Tool output с инструкцией не меняет policy | PASS/PARTIAL | output не является policy input; отдельный hostile-output integration test отсутствует |
| Неизвестный tool отклоняется до исполнения | PASS | plan validation + policy test |
| Workspace boundary не даёт доступ к чужим данным | PARTIAL | tool boundary PASS; caller auth context отсутствует |

## Инженерный контур

| Требование PDF | Статус | Evidence |
|---|---|---|
| API/planner/policy/gateway/storage разделены | PASS | `server/` modules |
| Mock и будущая реальная зависимость имеют gateway boundary | PASS | `server/services/gateway.ts` |
| Execution не зависит от браузера | PASS | server-side task service + SQLite |
| Конфигурация через env | PASS | `DB_PATH`, `PORT`, `NEXT_PUBLIC_API_URL` |
| Миграция/создание схемы при запуске | PASS | `sequelize.sync()` |
| Ровно три обязательных теста | PASS | три `test(...)` в `server/test/core.test.ts` |

## Комплект сдачи

| Требование PDF | Статус |
|---|---|
| README с направлением, запуском и архитектурой | PASS |
| Три автоматических теста и команда запуска | PASS |
| Demo-сценарий | PASS |
| AI-report | PASS |
| Три угрозы, ограничения и следующие шаги | PASS |
| Фактически затраченное время | PARTIAL — поле нужно заполнить автору |
| Видео до 3 минут | N/A — внешний материал |
| Публичный GitHub/ZIP | N/A — внешний материал |

## Правило проверки

Перед изменением кода сначала обновляется эта матрица или связанная документация. После изменения
выполняются:

```bash
npm run fsd:check
npm run typecheck
npm run lint
npm test
docker compose config
```

Для последовательного локального прогона без параллельной записи в `.next` используется:

```bash
npm run verify
```

Затем повторно проверяются соответствующие runtime-сценарии из матрицы.