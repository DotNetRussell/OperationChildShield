#!/usr/bin/env bash
# Run on the production droplet to pull GHCR images and restart the stack.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/operationchildshield}"
IMAGE_TAG="${IMAGE_TAG:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.ghcr.yml}"

cd "$APP_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export IMAGE_TAG
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://$(curl -fsS ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')}"

# Public GHCR packages can be pulled anonymously; if private, set GHCR_TOKEN in .env
if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-dotnetrussell}" --password-stdin
fi

docker compose -f "$COMPOSE_FILE" pull
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Waiting for backend health..."
for i in $(seq 1 40); do
  if docker compose -f "$COMPOSE_FILE" exec -T backend curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "Backend healthy."
    docker compose -f "$COMPOSE_FILE" ps
    exit 0
  fi
  sleep 3
done

echo "Backend health check timed out" >&2
docker compose -f "$COMPOSE_FILE" ps
docker compose -f "$COMPOSE_FILE" logs --tail=80 backend || true
exit 1
