"""Volunteer / get-involved signup capture (local file storage)."""

from __future__ import annotations

import json
import logging
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_rate_lock = Lock()
_rate_hits: dict[str, list[float]] = {}
_RATE_WINDOW_SECONDS = 3600
_RATE_MAX = 8


class InvolveSignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: str = Field(..., min_length=3, max_length=254)
    state: str = Field(default="", max_length=64)
    interest: str = Field(default="", max_length=64)
    message: str = Field(default="", max_length=2000)
    consent: bool = False
    # Honeypot - real users leave blank; bots often fill it.
    website: str = Field(default="", max_length=200)

    @field_validator("name", "email", "state", "interest", "message", "website")
    @classmethod
    def strip_strings(cls, value: str) -> str:
        return (value or "").strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not _EMAIL_RE.match(value):
            raise ValueError("Invalid email address")
        return value.lower()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _check_rate_limit(ip: str) -> None:
    now = time.time()
    with _rate_lock:
        hits = [t for t in _rate_hits.get(ip, []) if now - t < _RATE_WINDOW_SECONDS]
        if len(hits) >= _RATE_MAX:
            raise HTTPException(
                status_code=429,
                detail="Too many signup attempts. Please try again later.",
            )
        hits.append(now)
        _rate_hits[ip] = hits


def _signup_path() -> Path:
    base = Path(settings.cache_dir)
    base.mkdir(parents=True, exist_ok=True)
    return base / "involve_signups.jsonl"


@router.post("/involve")
async def submit_involve_signup(body: InvolveSignupRequest, request: Request):
    # Silent success for honeypot traps so bots don't learn the field.
    if body.website:
        logger.info("Involve honeypot triggered from %s", _client_ip(request))
        return {"ok": True, "message": "Thank you for signing up."}

    if not body.consent:
        raise HTTPException(
            status_code=400,
            detail="Consent is required to submit this form.",
        )

    _check_rate_limit(_client_ip(request))

    allowed_interests = {
        "",
        "volunteer",
        "advocacy",
        "media",
        "partner",
        "other",
    }
    interest = body.interest.lower()
    if interest not in allowed_interests:
        interest = "other"

    record = {
        "submittedAt": datetime.now(timezone.utc).isoformat(),
        "name": body.name,
        "email": body.email,
        "state": body.state,
        "interest": interest,
        "message": body.message,
        "source": "get-involved",
    }

    path = _signup_path()
    try:
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError:
        logger.exception("Failed to persist involve signup")
        raise HTTPException(
            status_code=503,
            detail="Unable to save signup right now. Please email Contact@OperationChildShield.com.",
        )

    logger.info(
        "Involve signup saved interest=%s state=%s",
        interest or "none",
        body.state or "none",
    )
    return {
        "ok": True,
        "message": "Thank you. We received your signup and will follow up.",
    }
