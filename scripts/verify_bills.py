#!/usr/bin/env python3
"""Verify every tracked bill title against its Congress.gov page."""

from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.bill_verification import verify_all_tracked_bills
from app.congress_client import CongressClient


async def main() -> int:
    client = CongressClient()
    try:
        results = await verify_all_tracked_bills(client)
    finally:
        await client.close()

    print("CONGRESS.GOV BILL VERIFICATION")
    print("=" * 100)

    failures = 0
    for r in results:
        status = "OK" if r["verified"] else "FAIL"
        if not r["verified"]:
            failures += 1
        print(f"\n[{status}] {r['congress']} {r['bill_type']} {r['number']}")
        print(f"  Configured: {r['configured_title']}")
        print(f"  Official:   {r['official_title']}")
        print(f"  URL:        {r['congress_url']}")

    print("\n" + "=" * 100)
    print(f"Result: {len(results) - failures}/{len(results)} verified")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))