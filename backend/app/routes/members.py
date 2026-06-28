from fastapi import APIRouter, HTTPException, Query, Request

from app.config import settings
from app.rate_limit import get_report_card_semaphore
from app.services import (
    build_directory,
    build_directory_by_grade,
    build_member_report_card,
    get_bills_summary,
    get_grade_index,
    serialize_report_card,
    summarize_grade_index,
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


@router.get("/grades/summary")
async def grades_summary(
    request: Request,
    congress: int | None = Query(None),
):
    client = request.app.state.congress_client
    congress_num = congress or settings.congress_number

    try:
        index = await get_grade_index(client, congress_num)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Grade index error: {e}")

    return {
        "counts": summarize_grade_index(index),
        "congress": congress_num,
        "total": len(index),
    }


@router.get("/members")
async def list_members(
    request: Request,
    search: str | None = Query(None, description="Search by name or state"),
    chamber: str | None = Query(None, description="House or Senate"),
    state: str | None = Query(None, description="State name or abbreviation"),
    party: str | None = Query(None, description="Party name filter"),
    grade: str | None = Query(None, description="Letter grade filter (A, B, C, D, F, N/A)"),
    sort: str | None = Query(None, description="Sort order: grade (F,D,C,B,A,N/A)"),
    congress: int | None = Query(None),
    limit: int | None = Query(None, ge=1, le=250, description="Max members to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    client = request.app.state.congress_client
    congress_num = congress or settings.congress_number

    try:
        if grade:
            members, total = await build_directory_by_grade(
                client,
                congress_num,
                grade=grade,
                search=search,
                chamber=chamber,
                state=state,
                party=party,
                limit=limit,
                offset=offset,
            )
        else:
            members, total = await build_directory(
                client,
                congress_num,
                search=search,
                chamber=chamber,
                state=state,
                party=party,
                limit=limit,
                offset=offset,
                sort=sort,
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
        "grade": grade,
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