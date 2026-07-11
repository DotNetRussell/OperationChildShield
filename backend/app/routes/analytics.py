"""Internal page-view ingest only - no public read API."""

from __future__ import annotations

import re
import time
from threading import Lock

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from app.analytics_store import record_page_view

router = APIRouter()

_rate_lock = Lock()
_rate_hits: dict[str, list[float]] = {}
_RATE_WINDOW = 60.0
_RATE_MAX = 120

_PATH_RE = re.compile(r"^/[A-Za-z0-9/_\-.%~]*$")


class PageViewEvent(BaseModel):
    path: str = Field(..., min_length=1, max_length=500)
    referrer: str = Field(default="", max_length=500)

    @field_validator("path", "referrer")
    @classmethod
    def strip_fields(cls, value: str) -> str:
        return (value or "").strip()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _rate_limit(ip: str) -> None:
    now = time.time()
    with _rate_lock:
        hits = [t for t in _rate_hits.get(ip, []) if now - t < _RATE_WINDOW]
        if len(hits) >= _RATE_MAX:
            raise HTTPException(status_code=429, detail="Too many analytics events")
        hits.append(now)
        _rate_hits[ip] = hits


@router.post("/analytics/event")
async def track_page_view(body: PageViewEvent, request: Request):
    """Record a page view into the server-side SQLite store. No read endpoint."""
    _rate_limit(_client_ip(request))

    path = body.path
    if not path.startswith("/") or path.startswith("//") or not _PATH_RE.match(path):
        raise HTTPException(status_code=400, detail="Invalid path")

    lower = path.lower()
    if (
        lower.startswith("/api/")
        or lower.startswith("/_next/")
        or lower.endswith((".js", ".css", ".map", ".ico", ".png", ".jpg", ".svg", ".woff2"))
    ):
        return {"ok": True, "skipped": True}

    ua = request.headers.get("user-agent", "")
    record_page_view(path, referrer=body.referrer or None, user_agent=ua)
    return {"ok": True}
