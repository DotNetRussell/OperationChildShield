from fastapi import APIRouter, HTTPException, Query, Request

from app.config import settings
from app.rate_limit import get_report_card_semaphore
from app.services import (
    build_directory,
    build_member_report_card,
    get_bills_summary,
    serialize_report_card,
)

router = APIRouter()


@router.get("/bills")
async def list_tracked_bills(request: Request):
    client = request.app.state.congress_client
    try:
        bills = await get_bills_summary(client)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Congress.gov API error: {e}")
    return {"bills": bills, "congress": settings.congress_number}


@router.get("/members")
async def list_members(
    request: Request,
    search: str | None = Query(None, description="Search by name or state"),
    chamber: str | None = Query(None, description="House or Senate"),
    state: str | None = Query(None, description="State name or abbreviation"),
    party: str | None = Query(None, description="Party name filter"),
    congress: int | None = Query(None),
    limit: int | None = Query(None, ge=1, le=250, description="Max members to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    client = request.app.state.congress_client
    congress_num = congress or settings.congress_number

    try:
        members, total = await build_directory(
            client,
            congress_num,
            search=search,
            chamber=chamber,
            state=state,
            party=party,
            limit=limit,
            offset=offset,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Congress.gov API error: {e}")

    return {
        "members": members,
        "total": total,
        "limit": limit,
        "offset": offset,
        "congress": congress_num,
    }


@router.get("/members/{bioguide_id}/report-card")
async def get_report_card(
    bioguide_id: str,
    request: Request,
    congress: int | None = Query(None),
):
    client = request.app.state.congress_client
    congress_num = congress or settings.congress_number

    try:
        async with get_report_card_semaphore():
            card = await build_member_report_card(client, bioguide_id, congress_num)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Congress.gov API error: {e}")

    return serialize_report_card(card)