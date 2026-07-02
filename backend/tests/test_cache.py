import json
import time

from app.cache import FileCache


def test_cache_set_and_get(tmp_path):
    cache = FileCache(cache_dir=str(tmp_path), ttl=60)
    cache.set("members/119", {"members": [1, 2, 3]})
    assert cache.get("members/119") == {"members": [1, 2, 3]}


def test_cache_miss_returns_none(tmp_path):
    cache = FileCache(cache_dir=str(tmp_path), ttl=60)
    assert cache.get("missing") is None


def test_cache_returns_stale_after_ttl(tmp_path):
    cache = FileCache(cache_dir=str(tmp_path), ttl=1)
    cache.set("key", "value")
    path = cache._path("key")
    data = json.loads(path.read_text())
    data["_cached_at"] = time.time() - 2
    path.write_text(json.dumps(data))
    assert cache.get("key") == "value"
    assert cache.is_stale("key")
    assert not cache.is_fresh("key")
    assert path.exists()


def test_cache_handles_corrupt_file(tmp_path):
    cache = FileCache(cache_dir=str(tmp_path), ttl=60)
    path = cache._path("bad")
    path.write_text("not-json")
    assert cache.get("bad") is None
    assert not path.exists()