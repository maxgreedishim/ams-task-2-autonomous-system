# Строгая проверка направления B — «Управляемые действия»

Дата проверки: 2026-09-13. Источник требований: `Downloads/AMS_задание_2_автономная_система.pdf`,
прочитан полностью до README и `docs/`. Проверялся только scope B.

## 1. Краткий вывод

Обязательное ядро направления B работоспособно: Docker-запуск, API, чтение через policy/gateway,
одноразовое подтверждение записи, идемпотентность `task_id`, audit и SQLite persistence подтверждены
фактическими сценариями. Автоматический набор содержит ровно три теста, все проходят.

`PARTIAL`: HTTP GET/confirm/cancel не имеют caller workspace/auth-контекста; `max_runtime_seconds` не
был доведён до контролируемого срабатывания в runtime; hostile-output проверен на уровне gateway
adapter, но отдельного HTTP/integration теста нет; визуальная проверка UI невозможна без доступного
браузера. Критических ошибок PDF не обнаружено.

## 2. Окружение и фактические порты

- Проект: `/Users/max/ams-task-2-autonomous-system`.
- Docker Desktop запущен.
- Первый sandbox-запуск `./run-docker.sh` дошёл до Docker socket и получил `permission denied`;
  это ограничение sandbox, не ошибка проекта.
- Повторный запуск с разрешённым доступом: client `3000`, server `4000`. В первом проходе скрипт
  корректно вычислил свободные `3001/4001`, затем после остановки старых контейнеров использовал
  `3000/4000`.

## 3. Команды и фактический результат

| Команда | Результат |
|---|---|
| `bash -n run-docker.sh` | PASS |
| `./run-docker.sh` | PASS с Docker-доступом; server/client Up, URL напечатаны |
| `npm run fsd:check` | PASS |
| `npm run typecheck` | PASS: Next build и server `tsc --noEmit` |
| `npm run lint` | PASS, без warnings |
| `npm test` | PASS: ровно 3 теста, 3 pass, 0 fail |
| `docker compose config` | PASS |
| `GET /health` | `200`, `{"ok":true}` |
| `HEAD /` | `200`, Next.js UI |

В Docker-логах подтверждены `npm install` внутри обоих контейнеров и успешный старт. Есть npm audit
уведомления: server 9 vulnerabilities, client 2; запуску они не помешали.

## 4. Матрица PDF → документация → код → runtime

| PDF | Документация | Код | Runtime | Статус |
|---|---|---|---|---|
| Выбрано только B | README/docs указывают B | `client/src/_pages/home/ui/HomePage.tsx:10` | UI заголовок B; API-сценарии B | PASS |
| `list_records` только текущий workspace | `docs/05-requirements/requirements.md:11` | `policy.ts:15-17`, `gateway.ts:13-18`, `mock-system.ts:9-10` | чужой workspace через policy отклонён; локальный mock не возвращает чужой record для demo workspace | PASS |
| `get_record` только `title/status/owner` | `requirements.md:12` | `policy.ts:18`, `mock-system.ts:16` | `note` отклонён до вызова; разрешённые поля возвращены | PASS |
| `create_followup` — запись после разрешения | `requirements.md:8-10` | `policy.ts:14,21`, `task-service.ts:47-50,122-129` | read-only блокирует; confirm выполняет после accepted confirmation | PASS |
| `read_only` блокирует до gateway | `pdf-traceability.md:37` | `task-service.ts:44-46` | 2 чтения выполнены, запись не вызвана, audit содержит `WRITE_BLOCKED_IN_READ_ONLY` | PASS |
| `confirm` показывает точный tool и args | `usm.md`, `pdf-traceability.md:38-39` | `planner.ts:6-8`, UI `TaskStatus.tsx:21` | `WAITING_CONFIRMATION`, plan содержит `create_followup` и args | PASS |
| Подтверждение одноразовое | `requirements.md:10` | `task-service.ts:124-129` | повторный confirm: один `CONFIRMATION_ACCEPTED`, один `TOOL_CALLED`, статус не меняется | PASS |
| `policy_automated` | `scope.md:6`, `pdf-traceability.md:42` | `policy.ts:21-22` | задача реально завершилась и вызвала запись | BONUS/PARTIAL |
| Tool output — данные, не policy | `pdf-traceability.md:43` | `gateway.ts:18-21`, `task-service.ts:64` | hostile adapter output `IGNORE POLICY...` вернулся как данные; policy не менялась | PASS/PARTIAL: нет отдельного HTTP integration теста |
| Неизвестный tool отклоняется до исполнения | `requirements.md:13` | `planner.ts:17-18`, `policy.ts:12`, `gateway.ts:21` | `validatePlan` вернул `UNKNOWN_TOOL`; mock не вызывался | PASS |
| Workspace boundary | `pdf-traceability.md:45`, `nfr.md:29-30` | `policy.ts:16,20`, `gateway.ts:14-15`, `createTask` `task-service.ts:75-80` | task boundary и mock write отказали; HTTP caller auth/workspace отсутствует | PARTIAL |
| `max_steps` | `nfr.md:23` | `task-service.ts:42` | `max_steps=1`: 1 вызов, `FAILED`, `STEP_LIMIT` | PASS |
| `max_tool_calls` | `nfr.md:23` | `policy.ts:13`, `task-service.ts:44-46` | `max_tool_calls=1`: 1 вызов, `FAILED`, `TOOL_CALL_LIMIT` | PASS |
| `max_runtime_seconds` | `nfr.md:23` | `task-service.ts:34-39,54` | код deadline есть; быстрый `=1` сценарий завершился на read-only policy до deadline | PARTIAL |
| Tasks/events после restart | `context.md`, `data-model.md` | `db.ts:87-90`, Compose volume | после restart server task COMPLETED и 16 events доступны | PASS |
| Обязательные маршруты | `docs/06-api/api.md` | `taskRoutes.ts:5-9` | health, POST/GET task, events, confirm, cancel проверены; 200/201/404/400 наблюдались | PASS |
| Ровно три обязательных теста | `traceability.md` | `server/test/core.test.ts:11,22,40` | Node test runner: ровно 3 | PASS |

## 5. Результаты ровно трёх автоматических тестов

1. `read_only blocks a write before gateway execution` — `server/test/core.test.ts:11`.
   Вход: read-only policy для `create_followup`, unknown tool, `fields:["note"]`. Эффект:
   write/unknown/недопустимое поле отклонены policy; это safe refusal.
2. `confirm mode waits for one explicit confirmation` — `server/test/core.test.ts:22`.
   Вход: task `confirm`, workspace `demo-a`, goal «Проверить записи». Эффект: `WAITING_CONFIRMATION`,
   затем `COMPLETED`, 3 шага/вызова, одна Followup-запись, повтор confirm не создаёт действие.
3. `reusing task_id returns the existing task and does not duplicate it` — `server/test/core.test.ts:40`.
   Вход: повторный `fixed-demo-task`, другой scope, лимиты, concurrent confirm, cancel. Эффект:
   один task/audit, scope mismatch, остановка лимита, одно конкурентное подтверждение, cancel защищён.

## 6. Docker-запуск через `run-docker.sh`

`run-docker.sh` имеет `-rwxr-xr-x`, проходит `bash -n`, вычисляет свободные порты, удаляет только
контейнеры проекта по Compose project/working-dir label и явно говорит, что чужие Compose-проекты не
трогает. `NEXT_PUBLIC_API_URL` собирается из фактического server-порта и экспортируется в Compose.
На штатном запуске подняты два контейнера `node:22-bookworm-slim`; зависимости устанавливаются в
контейнерах. `docker compose -p ams-task-2-autonomous-system ps -a` показал оба `Up`.

## 7. FSD, TypeScript и lint

FSD-проверка анализирует исходные `ts/tsx/js/jsx/mjs`, проверяет слои, alias cross-layer, reverse
imports, public API и deep imports (`client/scripts/check-fsd.mjs:9-82`), результат PASS. Next.js routes
находятся в `client/app`, FSD — в `client/src`; слои `_app`, `_pages`, `widgets`, `features`,
`entities`, `shared` присутствуют. TypeScript и lint PASS.

## 8. API и обязательные сценарии B

- Только чтение: `POST /tasks` → `201`, `FAILED` после безопасной блокировки; 2 чтения, 0 записей,
  audit policy + state change с `WRITE_BLOCKED_IN_READ_ONLY`.
- Подтверждение: `POST /tasks` → `201`, `WAITING_CONFIRMATION`; exact plan/args видны. Confirm →
  `200`, `COMPLETED`, `tool_calls=3`, Followup в `demo-a`; второй confirm → `200`, без нового действия.
- Повторная отправка: тот же `task_id` вернулся с тем же `trace_id`; scope mismatch → `400`.
- Unknown tool: `validatePlan` → `UNKNOWN_TOOL` до gateway.
- Workspace: policy вернула `WORKSPACE_BOUNDARY`; `getRecord(demo-a, rec-9)` → `null`, write →
  `RECORD_NOT_FOUND`; утечки из task workspace не было.
- Поля: `title/status/owner` разрешены, `note` → `INVALID_TOOL_ARGS` до инструмента.
- Недоверенный output: текст hostile adapter возвращён как output, не исполнен и не попал в policy.
- Лимиты: steps и tool calls фактически остановили execution; runtime deadline реализован кодом, но
  controlled slow-call сценарий отсутствует.
- Cancel: `WAITING_CONFIRMATION` → `CANCELLED`; последующий confirm сохранил `CANCELLED`.
- Restart: task и audit остались доступны; trace/task/plan/result/limits сохранены.

## 9. Расхождения PDF, документации и кода

- PDF требует проверяемый hostile output, но API не предоставляет способ внедрить output; docs честно
  помечают это `PASS/PARTIAL`, фактическая проверка выполнена прямым adapter-сценарием.
- PDF workspace boundary обязательна; docs уже отмечают отсутствие caller auth. Код ограничивает
  task/tool args, но `GET /tasks/:taskId` не проверяет caller workspace (`taskController.ts:10-14`),
  поэтому это не полный межтенантный HTTP boundary.
- PDF делает `policy_automated` бонусом; docs маркируют его `BONUS/PARTIAL`, код выполняет режим без
  отдельной бизнес-allowlist policy.
- PDF требует реального runtime-лимита; код имеет deadline (`task-service.ts:34-39`), но текущий
  demo не позволяет детерминированно задержать gateway, поэтому runtime PASS не подтверждён.
- README предлагает `docker compose up` как альтернативу, но требуемая строгая проверка выполнена
  именно `./run-docker.sh`.

## 10. Найденные и исправленные дефекты

Кодовых дефектов, создающих запись без разрешения, повторное действие или утечку из task workspace,
по проверенным сценариям не найдено; исправления кода не потребовались. Документация уже отражает
основные ограничения как `PARTIAL`/`BONUS`. Поэтому повторного TypeScript-прогона после изменения
кода нет; обязательный финальный `npm run typecheck` выполнен и PASS.

## 11. Оставшиеся ограничения и бонусы

- `policy_automated` работает как бонусный режим, но отдельная узкая business allowlist не выделена.
- Нет реальной authentication/authorization; identity приходит из запроса.
- Нет отдельного hostile-output integration API-теста.
- Нет контролируемого slow gateway-теста для `max_runtime_seconds`.
- Follow-up mock использует детерминированный id и отдельная предметная логика хранения ограничена.
- Cancel реализован и проверен — бонус PDF.

## 12. Что невозможно проверить из-за окружения

В CUA-браузерном окружении нет доступного browser surface (`No browser is available`), поэтому без
перезагрузки страницы и viewport около MacBook 13.3″ нельзя честно подтвердить визуально: замену
карточки, автоматическую загрузку audit, отсутствие page/internal scroll, перенос UUID и отсутствие
обрезания текста. Статический код показывает React state replacement через `key={task.task_id}`,
`useEffect` загрузки events и CSS `overflow:hidden`, но это не заменяет визуальный runtime PASS.
