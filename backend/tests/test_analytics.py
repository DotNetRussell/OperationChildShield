from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes import analytics
from app import analytics_store


def _app(tmp_path: Path, monkeypatch) -> TestClient:
    monkeypatch.setattr(analytics_store.settings, "cache_dir", str(tmp_path))
    analytics_store._initialized = False
    analytics_store.init_analytics_db()
    app = FastAPI()
    app.include_router(analytics.router, prefix="/api")
    return TestClient(app)


def test_track_persists_to_sqlite(tmp_path, monkeypatch):
    client = _app(tmp_path, monkeypatch)

    r1 = client.post("/api/analytics/event", json={"path": "/metrics", "referrer": ""})
    r2 = client.post(
        "/api/analytics/event", json={"path": "/learn", "referrer": "https://x.com"}
    )
    r3 = client.post("/api/analytics/event", json={"path": "/metrics"})
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 200

    # No public read API
    assert client.get("/api/analytics").status_code == 404
    assert client.get("/api/analytics?days=7").status_code == 404

    db = tmp_path / "analytics.db"
    assert db.exists()

    import sqlite3

    conn = sqlite3.connect(str(db))
    try:
        count = conn.execute("SELECT COUNT(*) FROM page_views").fetchone()[0]
        paths = {
            row[0]: row[1]
            for row in conn.execute(
                "SELECT path, COUNT(*) FROM page_views GROUP BY path"
            ).fetchall()
        }
    finally:
        conn.close()

    assert count == 3
    assert paths["/metrics"] == 2
    assert paths["/learn"] == 1


def test_rejects_invalid_path(tmp_path, monkeypatch):
    client = _app(tmp_path, monkeypatch)
    res = client.post(
        "/api/analytics/event",
        json={"path": "https://evil.example/x"},
    )
    assert res.status_code == 400


def test_skips_asset_paths(tmp_path, monkeypatch):
    client = _app(tmp_path, monkeypatch)
    res = client.post("/api/analytics/event", json={"path": "/_next/static/chunk.js"})
    assert res.status_code == 200
    assert res.json().get("skipped") is True

    import sqlite3

    conn = sqlite3.connect(str(tmp_path / "analytics.db"))
    try:
        count = conn.execute("SELECT COUNT(*) FROM page_views").fetchone()[0]
    finally:
        conn.close()
    assert count == 0
