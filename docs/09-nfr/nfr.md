# Non-functional requirements

## Engineering requirements from PDF

- API, planner, policy/gateway и storage разделены по модулям;
- planner не вызывает инструменты напрямую;
- mock dependency заменяема через gateway boundary;
- схема SQLite создаётся при запуске;
- секреты, токены и полный чувствительный input не попадают в audit и ошибки;
- запуск воспроизводим через Docker Compose без платных API.

## Security

- только известные tools;
- allowlist аргументов и полей;
- workspace check в policy/gateway;
- write approval в `confirm`;
- один task id не может быть повторно использован из другого scope;
- output tool не является инструкцией для policy.

## Reliability

- max steps, max tool calls и runtime deadline;
- cancel защищает от перехода в `COMPLETED`;
- task и audit переживают рестарт server.

## Known limitations

- demo identity приходит из запроса, полноценной auth нет;
- API GET/confirm/cancel не принимает отдельный caller workspace context;
- follow-up mock не хранится отдельной строкой;
- отдельный тест зависшего gateway-вызова не реализован.