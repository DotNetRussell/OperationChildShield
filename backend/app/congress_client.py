from typing import Any

import httpx

from app.cache import FileCache
from app.config import settings


class CongressClient:
    PAGE_SIZE = 250

    def __init__(self):
        self.base_url = settings.congress_base_url
        self.api_key = settings.congress_api_key
        self.cache = FileCache()
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=60.0)
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _request(self, path: str, params: dict | None = None) -> dict[str, Any]:
        cache_key = f"{path}?{params or {}}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        if not self.api_key:
            raise ValueError(
                "CONGRESS_API_KEY is not set. Get a free key at https://api.congress.gov/sign-up/"
            )

        client = await self._get_client()
        query = {"api_key": self.api_key, "format": "json", "limit": self.PAGE_SIZE}
        if params:
            query.update(params)

        url = f"{self.base_url}{path}"
        response = await client.get(url, params=query)
        response.raise_for_status()
        data = response.json()
        self.cache.set(cache_key, data)
        return data

    async def get_members(self, congress: int, current_only: bool = True) -> list[dict]:
        params = {"currentMember": str(current_only).lower()}
        data = await self._request(f"/member/congress/{congress}", params)
        return data.get("members", [])

    async def get_member(self, bioguide_id: str) -> dict:
        data = await self._request(f"/member/{bioguide_id}")
        return data.get("member", data)

    async def get_house_votes_page(
        self, congress: int, session: int, offset: int = 0
    ) -> list[dict]:
        data = await self._request(
            f"/house-vote/{congress}/{session}",
            {"offset": offset, "limit": self.PAGE_SIZE},
        )
        return data.get("houseRollCallVotes", [])

    async def get_all_house_votes(self, congress: int, session: int) -> list[dict]:
        cache_key = f"all_house_votes_v2_{congress}_{session}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        all_votes: list[dict] = []
        offset = 0
        while True:
            page = await self.get_house_votes_page(congress, session, offset)
            if not page:
                break
            all_votes.extend(page)
            if len(page) < self.PAGE_SIZE:
                break
            offset += self.PAGE_SIZE

        self.cache.set(cache_key, all_votes)
        return all_votes

    async def get_house_vote_members(self, congress: int, session: int, roll_call: int) -> list[dict]:
        """All member positions for a roll call (paginated, cached per roll call)."""
        from app.utils import normalize_vote_results

        cache_key = f"house_vote_members_v1_{congress}_{session}_{roll_call}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        all_items: list[dict] = []
        offset = 0
        seen_first_ids: set[str] = set()

        while True:
            data = await self._request(
                f"/house-vote/{congress}/{session}/{roll_call}/members",
                {"offset": offset},
            )
            payload = data.get("houseRollCallVoteMemberVotes", data)
            items = normalize_vote_results(payload)
            if not items:
                break

            first_id = (
                items[0].get("bioguideId")
                or items[0].get("bioguideID")
                or ""
            )
            if offset > 0 and first_id in seen_first_ids:
                break
            if first_id:
                seen_first_ids.add(first_id)

            all_items.extend(items)
            if len(items) < self.PAGE_SIZE:
                break
            offset += self.PAGE_SIZE

        self.cache.set(cache_key, all_items)
        return all_items

    async def get_bill(self, congress: int, bill_type: str, number: int) -> dict:
        data = await self._request(f"/bill/{congress}/{bill_type.lower()}/{number}")
        return data.get("bill", data)

    async def find_house_votes_for_bill(
        self, congress: int, bill_type: str, number: int
    ) -> list[dict]:
        """Find all House roll call votes associated with a specific bill."""
        cache_key = f"bill_votes_v3_{congress}_{bill_type.upper()}_{number}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        bill_type_upper = bill_type.upper()
        matching: list[dict] = []

        for session in (1, 2):
            try:
                votes = await self.get_all_house_votes(congress, session)
            except httpx.HTTPStatusError:
                continue

            for vote in votes:
                leg_type = (vote.get("legislationType") or "").upper()
                leg_num = vote.get("legislationNumber")
                if leg_type == bill_type_upper and str(leg_num) == str(number):
                    vote = dict(vote)
                    vote["_session"] = session
                    matching.append(vote)

        self.cache.set(cache_key, matching)
        return matching