# User scenarios

## Основной сценарий

Пользователь создаёт задачу в `confirm`, видит план и точные аргументы `create_followup`,
подтверждает действие и получает `COMPLETED` с audit.

## Безопасный отказ

В `read_only` planner может построить запись в плане, но policy останавливает выполнение до gateway
с решением `WRITE_BLOCKED_IN_READ_ONLY`.

## Защита от повторения

Повторное подтверждение завершённой задачи не вызывает gateway. Повторный `task_id` в том же scope
возвращает исходную задачу; другой workspace/user получает `TASK_ID_SCOPE_MISMATCH`.