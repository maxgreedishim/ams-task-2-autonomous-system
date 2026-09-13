# AMS Task 2 — управляемые автономные действия

Рабочий прототип направления B из тестового задания AMS. Агент принимает цель, строит
детерминированный план, вызывает mock-инструменты только через policy и gateway, ждёт подтверждение
записи и сохраняет аудит в SQLite.

## Запуск

```bash
npm run install:all
npm run dev
```

Открыть http://localhost:3000. API работает на http://localhost:4000.

Альтернатива — Docker Compose:

```bash
docker compose up
```

## Demo

1. Оставить режим `confirm` и создать задачу.
2. Убедиться, что состояние стало `WAITING_CONFIRMATION`, а точный `create_followup` виден в плане.
3. Нажать подтверждение и показать `COMPLETED` и audit.
4. Повторно нажать подтверждение: второе изменение не создаётся.
5. Выбрать `read_only`: запись блокируется policy до gateway.
6.  При необходимости отправить `POST /tasks/{task_id}/cancel`: активная задача переходит в
   `CANCELLED`.

## Архитектура

```text
client (Next.js/FSD) → server API (Express)
                         ├─ services/planner — только структурированный план
                         ├─ services/policy — allowlist, режимы, workspace и лимиты
                         ├─ services/gateway — единственная точка вызова tools
                         ├─ services/mock-system — изолированные данные demo-a
                         ├─ controllers/routes — HTTP-контур
                         ├─ middleware/error — request context и единый формат ошибок
                         └─ db.ts — Sequelize + SQLite: tasks/events
```

Клиент разделён по FSD-слоям: `_app`, `_pages`, `widgets`, `features`, `entities`, `shared`. Для
Next.js App Router маршруты находятся отдельно в `client/app`, а FSD-слои — в `client/src`; префиксы
`_app` и `_pages` следуют официальному руководству FSD для Next.js и не конфликтуют с
зарезервированными каталогами Next.js.

## Проверки

```bash
npm run lint
npm run typecheck
npm test
npm run fsd:check
```

`npm test` автоматически запускает `fsd:check`, TypeScript build/typecheck и backend-тесты.
FSD-проверка контролирует слои, направление импортов, публичные API слайсов и отсутствие deep
imports между слайсами. Тесты проверяют безопасный отказ записи, одноразовое подтверждение и
идемпотентность `task_id`.

## Допущения и ограничения

-  Planner детерминированный; точка подключения LLM — `server/services/planner.ts`, а его результат
  должен проходить ту же валидацию policy.
-  Mock-инструменты не заменяют реальную CRM; точку вызова в `server/services/gateway.ts` можно
  заменить реальным адаптером без изменения task-service.
-  `create_followup` — mock-запись: результат возвращается в task result, но отдельная сущность
  follow-up в SQLite не хранится; повторное подтверждение задачи не вызывает инструмент повторно.
-  `max_runtime_seconds` ограничивает общее время выполнения task execution и прерывает зависший
  вызов gateway.
-  Все лимиты должны быть положительными целыми числами; `max_steps` и `max_tool_calls` проверяются
  перед каждым действием.
- Нет реальной аутентификации: `workspace_id`, `user_id` и `role` приходят из demo-клиента.

## Угрозы

1. Prompt/tool injection в output mock-системы: output считается данными и не может изменить policy.
2. Повторная запись: защищена состоянием задачи и одноразовым переходом из `WAITING_CONFIRMATION`.
3. Утечка workspace: gateway и mock-system фильтруют записи по `workspace_id`.

## AI-report

Codex использовался для генерации каркаса, UI, тестов и документации. Вручную проверены
архитектурные границы, отсутствие прямого вызова tools из planner, policy для `read_only`/`confirm`,
идемпотентность и команды запуска. Внешние LLM и реальные данные в demo не используются.

## Перед отправкой

- Фактически затраченное время: 3 часа.
-  Docker-клиент использует отдельный `.next-docker`, поэтому host-side `next build` не конфликтует
  с контейнерным `next dev`. Для чистой проверки сначала остановите другой Compose-проект на портах
  3000/4000.
-  Видео до 3 минут: создать задачу в `confirm`, показать ожидающее подтверждение, отказ
  `read_only`, повторное подтверждение и audit.
-  Демонстрационная запись: `demo/recording-2026-09-13.mov`.
-  Следующие технические шаги: подключить аутентификацию и авторизацию workspace, вынести mock
  adapter за конфигурационный интерфейс, добавить измерение runtime и интеграционные HTTP-тесты.
