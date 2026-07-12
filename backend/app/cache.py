import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any

from app.config import settings


class FileCache:
    def __init__(self, cache_dir: str | None = None, ttl: int | None = None):
        self.cache_dir = Path(cache_dir or settings.cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = ttl or settings.cache_ttl_seconds

    def _path(self, key: str) -> Path:
        # Flatten path separators and neutralize traversal / special segments.
        safe = (
            key.replace("/", "_")
            .replace("\\", "_")
            .replace(":", "_")
            .replace("..", "_")
        )
        safe = "".join(c if c.isalnum() or c in "._-?={} ," else "_" for c in safe)
        if len(safe) > 200:
            # Keep filenames bounded while remaining unique enough for our keys.
            digest = hashlib.sha256(key.encode()).hexdigest()[:16]
            safe = f"{safe[:160]}_{digest}"
        return self.cache_dir / f"{safe}.json"

    def _read_entry(self, key: str) -> dict[str, Any] | None:
        path = self._path(key)
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text())
        except (json.JSONDecodeError, OSError):
            path.unlink(missing_ok=True)
            return None

    def get(self, key: str) -> Any | None:
        """Return cached payload, including stale entries (stale-while-revalidate)."""
        data = self._read_entry(key)
        if data is None:
            return None
        return data.get("payload")

    def is_stale(self, key: str) -> bool:
        data = self._read_entry(key)
        if data is None:
            return False
        return time.time() - data.get("_cached_at", 0) > self.ttl

    def is_fresh(self, key: str) -> bool:
        data = self._read_entry(key)
        if data is None:
            return False
        return time.time() - data.get("_cached_at", 0) <= self.ttl

    def set(self, key: str, payload: Any) -> None:
        path = self._path(key)
        path.write_text(json.dumps({"_cached_at": time.time(), "payload": payload}))
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass
