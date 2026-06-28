#!/usr/bin/env bash
# Deploy Operation Child Shield to production.
# Copy to deploy-prod.sh and set DEPLOY_REMOTE to your server (gitignored).
#
# Usage: ./scripts/deploy-prod.sh [user@host]
set -euo pipefail

REMOTE="${1:-${DEPLOY_REMOTE:-user@your-server.example.com}}"
APP_DIR="${DEPLOY_APP_DIR:-/opt/operationchildshield}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Verifying bills against Congress.gov..."
if ! python3 "$ROOT/scripts/verify_bills.py" 2>/dev/null; then
  docker compose -f "$ROOT/docker-compose.yml" run --rm --no-deps backend python3 -c "
import asyncio
from app.bill_verification import verify_all_tracked_bills
from app.congress_client import CongressClient

async def main():
    c = CongressClient()
    try:
        r = await verify_all_tracked_bills(c)
        fails = [x for x in r if not x['verified']]
        if fails:
            raise SystemExit(f'{len(fails)} bill(s) failed verification')
        print(f'All {len(r)} tracked bills verified against Congress.gov')
    finally:
        await c.close()

asyncio.run(main())
"
fi

echo "==> Syncing to $REMOTE:$APP_DIR"
rsync -avz --delete \
  --exclude '.env' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '__pycache__' \
  --exclude 'data' \
  --exclude '.git' \
  "$ROOT/" "$REMOTE:$APP_DIR/"

echo "==> Rebuilding containers on production"
ssh "$REMOTE" "cd $APP_DIR && docker compose -f docker-compose.prod.yml up --build -d"

echo "==> Checking production /api/health"
curl -fsS "https://operationchildshield.org/api/health" | python3 -c "
import json, sys
data = json.load(sys.stdin)
assert data.get('status') == 'ok', data
print('Production health check passed')
"

echo "Deploy complete."