import pytest

from app.congress_client import CongressClient


class FakeCache:
    def __init__(self):
        self.store: dict[str, object] = {}

    def get(self, key: str):
        return self.store.get(key)

    def set(self, key: str, value: object) -> None:
        self.store[key] = value


def _member(bioguide_id: str) -> dict:
    return {"bioguideId": bioguide_id, "name": bioguide_id}


@pytest.mark.asyncio
async def test_get_members_fetches_all_pages(monkeypatch, tmp_path):
    monkeypatch.setenv("CACHE_DIR", str(tmp_path))
    from app.config import settings

    settings.cache_dir = str(tmp_path)

    client = CongressClient()
    client.cache = FakeCache()

    pages = {
        0: {"members": [_member(f"M{i:03d}") for i in range(250)]},
        250: {"members": [_member(f"M{i:03d}") for i in range(250, 500)]},
        500: {"members": [_member(f"M{i:03d}") for i in range(500, 537)]},
    }

    async def fake_get_members_page(congress: int, current_only: bool = True, offset: int = 0):
        assert congress == 119
        assert current_only is True
        return pages[offset]

    monkeypatch.setattr(client, "get_members_page", fake_get_members_page)

    members = await client.get_members(119)

    assert len(members) == 537
    assert members[0]["bioguideId"] == "M000"
    assert members[-1]["bioguideId"] == "M536"
    assert len(client.cache.get("all_members_v2_119_True")) == 537