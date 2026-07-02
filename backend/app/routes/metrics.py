import csv
import io

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.config import settings
from app.metrics import build_metrics_dashboard

router = APIRouter()


@router.get("/metrics")
async def get_metrics(
    request: Request,
    congress: int | None = Query(None),
):
    client = request.app.state.congress_client
    congress_num = congress or settings.congress_number

    try:
        payload = await build_metrics_dashboard(client, congress_num)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Metrics error: {e}")

    return payload


@router.get("/metrics/export")
async def export_metrics_csv(
    request: Request,
    congress: int | None = Query(None),
):
    client = request.app.state.congress_client
    congress_num = congress or settings.congress_number

    try:
        payload = await build_metrics_dashboard(client, congress_num)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Metrics export error: {e}")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "bill_id",
            "bill_number",
            "bill_title",
            "eligible_members",
            "votes_yes",
            "votes_no",
            "votes_not_voting",
            "votes_present",
            "participation_rate",
            "policy_consistent_votes",
            "policy_not_consistent_votes",
            "congress_url",
        ]
    )

    for bill in payload.get("bills", []):
        counts = bill.get("voteCounts", {})
        writer.writerow(
            [
                bill.get("billId"),
                bill.get("billNumber"),
                bill.get("billTitle"),
                bill.get("eligibleMembers"),
                counts.get("yes", 0),
                counts.get("no", 0),
                counts.get("notVoting", 0),
                counts.get("present", 0),
                bill.get("participationRate"),
                bill.get("policyConsistentVotes"),
                bill.get("policyNotConsistentVotes"),
                bill.get("congressUrl"),
            ]
        )

    output.seek(0)
    filename = f"operation-child-shield-bill-metrics-{congress_num}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )