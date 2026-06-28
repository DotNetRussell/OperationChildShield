from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes.health import router as health_router


def _test_app() -> FastAPI:
    app = FastAPI()
    app.include_router(health_router, prefix="/api")
    return app


def test_health_endpoint():
    client = TestClient(_test_app())
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "operation-child-shield-api"
    assert "congress" in data
    assert "api_key_configured" in data