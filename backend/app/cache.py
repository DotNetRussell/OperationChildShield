import json
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
        safe = key.replace("/", "_").replace(":", "_")
        return self.cache_dir / f"{safe}.json"

    def get(self, key: str) -> Any | None:
        path = self._path(key)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text())
            if time.time() - data.get("_cached_at", 0) > self.ttl:
                path.unlink(missing_ok=True)
                return None
            return data.get("payload")
        except (json.JSONDecodeError, OSError):
            path.unlink(missing_ok=True)
            return None

    def set(self, key: str, payload: Any) -> None:
        path = self._path(key)
        path.write_text(json.dumps({"_cached_at": time.time(), "payload": payload}))