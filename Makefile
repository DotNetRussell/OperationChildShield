.PHONY: test test-backend test-frontend lint install verify-bills dev dev-local

test:
	./scripts/test.sh

test-backend:
	cd backend && python3 -m pytest -q

test-frontend:
	cd frontend && npm test

lint:
	cd frontend && npm run lint

install:
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && npm install

verify-bills:
	python3 scripts/verify_bills.py

dev:
	docker compose up --build

dev-local:
	./scripts/dev-local.sh start