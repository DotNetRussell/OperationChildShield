import asyncio

_report_card_semaphore = asyncio.Semaphore(2)


def get_report_card_semaphore() -> asyncio.Semaphore:
    return _report_card_semaphore