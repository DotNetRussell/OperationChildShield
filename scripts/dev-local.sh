#!/usr/bin/env bash
# Run backend + frontend locally without Docker (for WSL / bare-metal dev).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PID_FILE="$ROOT/.dev-backend.pid"
FRONTEND_PID_FILE="$ROOT/.dev-frontend.pid"

stop_one() {
  local pid_file="$1"
  local name="$2"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      echo "Stopped $name (pid $pid)"
    fi
    rm -f "$pid_file"
  fi
}

stop_all() {
  stop_one "$BACKEND_PID_FILE" "backend"
  stop_one "$FRONTEND_PID_FILE" "frontend"
}

start_backend() {
  mkdir -p "$ROOT/data"
  cd "$ROOT/backend"
  if [[ ! -d .venv ]]; then
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements.txt -r requirements-dev.txt
  fi
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
  export CACHE_DIR="$ROOT/data"
  export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000}"
  nohup .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 \
    >"$ROOT/data/backend-dev.log" 2>&1 &
  echo $! >"$BACKEND_PID_FILE"
  echo "Backend starting on http://127.0.0.1:8000 (log: data/backend-dev.log)"
}

start_frontend() {
  cd "$ROOT/frontend"
  npm install --silent
  nohup env NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev -- --hostname 127.0.0.1 --port 3000 \
    >"$ROOT/data/frontend-dev.log" 2>&1 &
  echo $! >"$FRONTEND_PID_FILE"
  echo "Frontend starting on http://127.0.0.1:3000 (log: data/frontend-dev.log)"
}

wait_for_health() {
  local i
  for i in $(seq 1 60); do
    if curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1 \
      && curl -fsS -o /dev/null http://127.0.0.1:3000 2>&1; then
      echo "Local stack ready:"
      echo "  Frontend  http://localhost:3000"
      echo "  Backend   http://localhost:8000"
      echo "  API docs  http://localhost:8000/docs"
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for services — check data/backend-dev.log and data/frontend-dev.log"
  return 1
}

case "${1:-start}" in
  start)
    stop_all
    start_backend
    start_frontend
    wait_for_health
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    start_backend
    start_frontend
    wait_for_health
    ;;
  status)
    for pair in "backend:$BACKEND_PID_FILE:8000" "frontend:$FRONTEND_PID_FILE:3000"; do
      IFS=: read -r name file port <<<"$pair"
      if [[ -f "$file" ]] && kill -0 "$(cat "$file")" 2>/dev/null; then
        echo "$name: running (pid $(cat "$file"), port $port)"
      else
        echo "$name: stopped"
      fi
    done
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac