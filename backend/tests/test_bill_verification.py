import pytest

import app.bill_verification as bill_verification
from app.bill_verification import get_official_title, verify_all_tracked_bills, verify_tracked_bill
from app.bills import get_bill_by_id


@pytest.fixture(autouse=True)
def clear_title_cache():
    bill_verification._official_titles.clear()
    yield
    bill_verification._official_titles.clear()


class FakeCongressClient:
    def __init__(self, responses: dict[str, dict] | None = None):
        self.responses = responses or {}
        self.calls: list[str] = []

    async def get_bill(self, congress: int, bill_type: str, number: int) -> dict:
        bill_id = f"{congress}-{bill_type.lower()}-{number}"
        self.calls.append(bill_id)
        return self.responses.get(
            bill_id,
            {"title": "", "congress": congress},
        )


@pytest.mark.asyncio
async def test_verify_tracked_bill_success():
    bill = get_bill_by_id("119-hr-6484")
    assert bill is not None
    client = FakeCongressClient(
        {"119-hr-6484": {"title": bill.title, "congress": 119}}
    )
    result = await verify_tracked_bill(client, bill)
    assert result["verified"] is True
    assert result["title_match"] is True
    assert result["congress_match"] is True


@pytest.mark.asyncio
async def test_verify_tracked_bill_title_mismatch():
    bill = get_bill_by_id("119-hr-6484")
    assert bill is not None
    client = FakeCongressClient(
        {"119-hr-6484": {"title": "Different Title", "congress": 119}}
    )
    result = await verify_tracked_bill(client, bill)
    assert result["verified"] is False
    assert result["title_match"] is False


@pytest.mark.asyncio
async def test_get_official_title_uses_cache():
    bill = get_bill_by_id("119-hr-6484")
    assert bill is not None
    client = FakeCongressClient(
        {"119-hr-6484": {"title": bill.title, "congress": 119}}
    )
    first = await get_official_title(client, bill)
    second = await get_official_title(client, bill)
    assert first == bill.title
    assert second == bill.title
    assert client.calls == ["119-hr-6484"]


@pytest.mark.asyncio
async def test_get_official_title_falls_back_to_configured_title():
    bill = get_bill_by_id("119-hr-6484")
    assert bill is not None
    client = FakeCongressClient({"119-hr-6484": {"title": "", "congress": 119}})
    title = await get_official_title(client, bill)
    assert title == bill.title


@pytest.mark.asyncio
async def test_verify_all_tracked_bills_returns_all_results():
    bill = get_bill_by_id("119-hr-6484")
    assert bill is not None
    responses = {
        b.bill_id: {"title": b.title, "congress": b.congress}
        for b in [bill]
    }
    client = FakeCongressClient(responses)
    results = await verify_all_tracked_bills(client)
    assert len(results) >= 30
    matching = next(r for r in results if r["bill_id"] == "119-hr-6484")
    assert matching["verified"] is True