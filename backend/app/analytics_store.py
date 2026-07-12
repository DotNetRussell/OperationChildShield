"""SQLite-backed page-view storage (server-side only; no public read surface)."""

from __future__ import annotations

import logging
import os
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_initialized = False

# Soft caps to resist unbounded disk growth from open write endpoint.
_MAX_PAGE_VIEWS = 500_000
_PRUNE_TO = 400_000


def _db_path() -> Path:
    base = Path(settings.cache_dir)
    base.mkdir(parents=True, exist_ok=True)
    return base / "analytics.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_db_path()), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _harden_db_file() -> None:
    path = _db_path()
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


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
        _harden_db_file()


def ensure_initialized() -> None:
    if not _initialized:
        init_analytics_db()


def _maybe_prune(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) FROM page_views").fetchone()[0]
    if count <= _MAX_PAGE_VIEWS:
        return
    # Keep the newest rows; delete oldest overflow.
    to_delete = count - _PRUNE_TO
    logger.warning("Pruning analytics page_views: deleting ~%s oldest rows", to_delete)
    conn.execute(
        """
        DELETE FROM page_views
        WHERE id IN (
            SELECT id FROM page_views ORDER BY viewed_at ASC, id ASC LIMIT ?
        )
        """,
        (to_delete,),
    )
    conn.commit()


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
            _maybe_prune(conn)
        finally:
            conn.close()
        _harden_db_file()
