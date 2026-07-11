"""SQLite-backed page-view storage (server-side only; no public read surface)."""

from __future__ import annotations

import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings

_lock = threading.Lock()
_initialized = False


def _db_path() -> Path:
    base = Path(settings.cache_dir)
    base.mkdir(parents=True, exist_ok=True)
    return base / "analytics.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_db_path()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_analytics_db() -> None:
    global _initialized
    with _lock:
        conn = _connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS page_views (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    path TEXT NOT NULL,
                    viewed_at TEXT NOT NULL,
                    referrer TEXT,
                    user_agent TEXT
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path)"
            )
            conn.commit()
            _initialized = True
        finally:
            conn.close()


def ensure_initialized() -> None:
    if not _initialized:
        init_analytics_db()


def record_page_view(
    path: str,
    *,
    referrer: str | None = None,
    user_agent: str | None = None,
    viewed_at: datetime | None = None,
) -> None:
    ensure_initialized()
    clean_path = (path or "/").strip() or "/"
    if len(clean_path) > 500:
        clean_path = clean_path[:500]
    if not clean_path.startswith("/") or clean_path.startswith("//"):
        clean_path = "/"

    ref = (referrer or "").strip()[:500] or None
    ua = (user_agent or "").strip()[:300] or None
    ts = (viewed_at or datetime.now(timezone.utc)).astimezone(timezone.utc)
    iso = ts.isoformat()

    with _lock:
        conn = _connect()
        try:
            conn.execute(
                """
                INSERT INTO page_views (path, viewed_at, referrer, user_agent)
                VALUES (?, ?, ?, ?)
                """,
                (clean_path, iso, ref, ua),
            )
            conn.commit()
        finally:
            conn.close()
