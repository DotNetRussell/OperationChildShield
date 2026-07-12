import asyncio

from app.security import (  # noqa: F401 — re-export shared helpers
    client_ip,
    rate_limit,
    reset_rate_limits_for_tests,
)

_report_card_semaphore = asyncio.Semaphore(2)


def get_report_card_semaphore() -> asyncio.Semaphore:
    return _report_card_semaphore
