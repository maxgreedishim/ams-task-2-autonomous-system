#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_PROJECT="ams-task-2-autonomous-system"
CLIENT_BASE_PORT="${CLIENT_START_PORT:-3000}"
SERVER_BASE_PORT="${SERVER_START_PORT:-4000}"

cd "$PROJECT_DIR"

echo "Проверяю уже запущенный Compose-проект $COMPOSE_PROJECT..."
existing_containers="$(docker compose -p "$COMPOSE_PROJECT" ps -q 2>/dev/null || true)"
project_containers="$(docker ps -aq --filter "label=com.docker.compose.project.working_dir=$PROJECT_DIR" 2>/dev/null || true)"
if [ -n "$existing_containers" ] || [ -n "$project_containers" ]; then
  echo "Останавливаю и удаляю контейнеры этого проекта..."
  docker compose -p "$COMPOSE_PROJECT" down --remove-orphans
  if [ -n "$project_containers" ]; then
    # Covers containers created from this directory with a custom Compose project name.
    docker rm -f $project_containers >/dev/null 2>&1 || true
  fi
else
  echo "Контейнеры этого проекта не запущены. Другие Compose-проекты не затрагиваю."
fi

port_is_free() {
  ! lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

find_free_port() {
  local port="$1"
  while ! port_is_free "$port"; do
    port=$((port + 1))
  done
  printf '%s' "$port"
}

CLIENT_PORT="$(find_free_port "$CLIENT_BASE_PORT")"
SERVER_PORT="$(find_free_port "$SERVER_BASE_PORT")"
NEXT_PUBLIC_API_URL="http://localhost:${SERVER_PORT}"

export CLIENT_PORT SERVER_PORT NEXT_PUBLIC_API_URL

echo "Запускаю client на http://localhost:${CLIENT_PORT}"
echo "Запускаю server на http://localhost:${SERVER_PORT}"

docker compose -p "$COMPOSE_PROJECT" up --build -d
docker compose -p "$COMPOSE_PROJECT" ps

echo
echo "Готово:"
echo "  UI:  http://localhost:${CLIENT_PORT}"
echo "  API: http://localhost:${SERVER_PORT}"
