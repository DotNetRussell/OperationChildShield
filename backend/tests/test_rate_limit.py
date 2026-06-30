import asyncio

from app.rate_limit import get_report_card_semaphore


def test_report_card_semaphore_limits_concurrency():
    sem = get_report_card_semaphore()
    assert sem._value == 2


async def _acquire_and_track(sem: asyncio.Semaphore, active: list[int], max_active: list[int]):
    async with sem:
        active[0] += 1
        max_active[0] = max(max_active[0], active[0])
        await asyncio.sleep(0.05)
        active[0] -= 1


def test_report_card_semaphore_enforces_limit_under_load():
    sem = get_report_card_semaphore()
    active = [0]
    max_active = [0]

    async def run():
        await asyncio.gather(
            *(_acquire_and_track(sem, active, max_active) for _ in range(6))
        )

    asyncio.run(run())
    assert max_active[0] <= 2