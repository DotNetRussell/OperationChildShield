#!/usr/bin/env bash
# Run backend and frontend unit tests (no Congress.gov API calls).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Backend tests"
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -r requirements.txt -r requirements-dev.txt
python -m pytest -q

echo "==> Frontend tests"
cd "$ROOT/frontend"
npm install --silent
npm test

echo "==> All tests passed"