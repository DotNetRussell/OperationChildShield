"""SMTP helpers for Join Us notifications (stdlib only)."""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


def _from_address() -> str:
    return (settings.smtp_from or settings.smtp_user or "").strip()


def _notify_to() -> str:
    return (settings.involve_notify_to or settings.smtp_user or "").strip()


def send_email(
    *,
    to: str,
    subject: str,
    body: str,
    reply_to: str | None = None,
) -> None:
    if not settings.smtp_configured:
        raise RuntimeError("SMTP is not configured")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = _from_address()
    msg["To"] = to
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.ehlo()
        smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)


def notify_involve_signup(record: dict[str, Any]) -> bool:
    """Email the ops inbox about a new Join Us submission. Returns True if sent."""
    if not settings.smtp_configured:
        logger.warning("SMTP not configured; involve signup not emailed")
        return False

    to = _notify_to()
    if not to:
        logger.warning("No involve notify recipient configured")
        return False

    name = record.get("name") or "(no name)"
    email = record.get("email") or "(no email)"
    interest = record.get("interest") or "(none)"
    state = record.get("state") or "(none)"
    message = record.get("message") or ""
    submitted = record.get("submittedAt") or ""

    body = (
        "New Operation Child Shield Join Us signup\n"
        "=========================================\n\n"
        f"Submitted: {submitted}\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"State: {state}\n"
        f"Interest: {interest}\n\n"
        f"Message:\n{message}\n"
    )

    send_email(
        to=to,
        subject=f"[OCS Join Us] {interest} — {name}",
        body=body,
        reply_to=email if "@" in str(email) else None,
    )
    return True


def auto_reply_involve_signup(record: dict[str, Any]) -> bool:
    """Optional confirmation email to the person who signed up."""
    if not settings.smtp_configured or not settings.involve_send_auto_reply:
        return False

    email = (record.get("email") or "").strip()
    if not email or "@" not in email:
        return False

    name = (record.get("name") or "").strip() or "friend"
    body = (
        f"Hi {name},\n\n"
        "Thank you for signing up with Operation Child Shield. We received your "
        "message and will follow up when there is a good fit for your interest.\n\n"
        "If you need to reach us sooner, email Contact@OperationChildShield.com.\n\n"
        "— Operation Child Shield\n"
        "Protect | Educate | Mobilize\n"
        "https://operationchildshield.org\n"
    )

    send_email(
        to=email,
        subject="We received your Operation Child Shield signup",
        body=body,
    )
    return True
