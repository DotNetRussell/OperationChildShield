"""Background cache revalidation (stale-while-revalidate)."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from app.cache import FileCache

logger = logging.getLogger(__name__)

_in_flight: dict[str, asyncio.Task[None]] = {}


def maybe_schedule_revalidation(
    cache: FileCache,
    key: str,
    refresh: Callable[[], Awaitable[Any]],
) -> None:
    """Serve stale cache immediately; refresh in the background when TTL has expired."""
    if not cache.is_stale(key):
        return

    existing = _in_flight.get(key)
    if existing is not None and not existing.done():
        return

    async def _run() -> None:
        try:
            await refresh()
        except Exception:
            logger.exception("Background cache refresh failed for %s", key)
        finally:
            _in_flight.pop(key, None)

    _in_flight[key] = asyncio.create_task(_run())