"""Internal page-view ingest only - no public read API."""

from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from app.analytics_store import record_page_view
from app.security import client_ip, rate_limit

router = APIRouter()

_PATH_RE = re.compile(r"^/[A-Za-z0-9/_\-.%~]*$")


class PageViewEvent(BaseModel):
    path: str = Field(..., min_length=1, max_length=500)
    referrer: str = Field(default="", max_length=500)

    @field_validator("path", "referrer")
    @classmethod
    def strip_fields(cls, value: str) -> str:
        return (value or "").strip()


@router.post("/analytics/event")
async def track_page_view(body: PageViewEvent, request: Request):
    """Record a page view into the server-side SQLite store. No read endpoint."""
    rate_limit(
        client_ip(request),
        bucket="analytics",
        max_hits=120,
        window_seconds=60.0,
        detail="Too many analytics events",
    )

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
