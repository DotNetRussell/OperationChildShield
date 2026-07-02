import asyncio

import pytest

from app.cache import FileCache
from app.cache_refresh import maybe_schedule_revalidation


@pytest.mark.asyncio
async def test_maybe_schedule_revalidation_runs_once_for_stale_key(tmp_path):
    cache = FileCache(cache_dir=str(tmp_path), ttl=1)
    cache.set("key", "old")
    path = cache._path("key")
    import json
    import time

    data = json.loads(path.read_text())
    data["_cached_at"] = time.time() - 2
    path.write_text(json.dumps(data))

    calls = 0

    async def refresh() -> str:
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.05)
        cache.set("key", "new")
        return "new"

    maybe_schedule_revalidation(cache, "key", refresh)
    maybe_schedule_revalidation(cache, "key", refresh)
    await asyncio.sleep(0.15)

    assert calls == 1
    assert cache.get("key") == "new"


@pytest.mark.asyncio
async def test_maybe_schedule_revalidation_skips_fresh_key(tmp_path):
    cache = FileCache(cache_dir=str(tmp_path), ttl=60)
    cache.set("key", "fresh")
    calls = 0

    async def refresh() -> None:
        nonlocal calls
        calls += 1

    maybe_schedule_revalidation(cache, "key", refresh)
    await asyncio.sleep(0.05)

    assert calls == 0