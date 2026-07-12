from fastapi import APIRouter, HTTPException, Query, Request

from app.config import settings
from app.rate_limit import get_report_card_semaphore
from app.security import (
    client_ip,
    rate_limit,
    safe_service_error,
    safe_upstream_error,
    validate_bioguide_id,
    validate_congress,
)
from app.services import (
    build_directory,
    build_member_report_card,
    get_bills_summary,
    serialize_report_card,
)

router = APIRouter()


@router.get("/bills")
async def list_tracked_bills(request: Request):
    rate_limit(
        client_ip(request),
        bucket="bills",
        max_hits=60,
        window_seconds=60.0,
    )
    client = request.app.state.congress_client
    try:
        bills = await get_bills_summary(client)
    except ValueError as e:
        raise safe_service_error(e)
    except Exception as e:
        raise safe_upstream_error(e, public_message="Unable to load tracked bills")
    return {"bills": bills, "congress": settings.congress_number}


@router.get("/members")
async def list_members(
    request: Request,
    search: str | None = Query(None, max_length=120, description="Search by name or state"),
    chamber: str | None = Query(None, max_length=32, description="House or Senate"),
    state: str | None = Query(None, max_length=64, description="State name or abbreviation"),
    party: str | None = Query(None, max_length=64, description="Party name filter"),
    congress: int | None = Query(None),
    limit: int | None = Query(None, ge=1, le=250, description="Max members to return"),
    offset: int = Query(0, ge=0, le=10_000, description="Pagination offset"),
):
    rate_limit(
        client_ip(request),
        bucket="members_list",
        max_hits=90,
        window_seconds=60.0,
    )
    client = request.app.state.congress_client
    congress_num = validate_congress(congress, settings.congress_number)

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
        raise safe_service_error(e)
    except Exception as e:
        raise safe_upstream_error(e, public_message="Unable to load members")

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
    rate_limit(
        client_ip(request),
        bucket="report_card",
        max_hits=30,
        window_seconds=60.0,
        detail="Too many report-card requests. Please try again later.",
    )
    bioguide_id = validate_bioguide_id(bioguide_id)
    client = request.app.state.congress_client
    congress_num = validate_congress(congress, settings.congress_number)

    try:
        async with get_report_card_semaphore():
            card = await build_member_report_card(client, bioguide_id, congress_num)
    except HTTPException:
        raise
    except ValueError as e:
        raise safe_service_error(e)
    except Exception as e:
        raise safe_upstream_error(e, public_message="Unable to load voting record")

    return serialize_report_card(card)
