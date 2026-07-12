import csv
import io

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from app.config import settings
from app.metrics import build_metrics_dashboard
from app.security import (
    client_ip,
    rate_limit,
    safe_service_error,
    safe_upstream_error,
    validate_congress,
)

router = APIRouter()


@router.get("/metrics")
async def get_metrics(
    request: Request,
    congress: int | None = Query(None),
):
    rate_limit(
        client_ip(request),
        bucket="metrics",
        max_hits=20,
        window_seconds=60.0,
        detail="Too many metrics requests. Please try again later.",
    )
    client = request.app.state.congress_client
    congress_num = validate_congress(congress, settings.congress_number)

    try:
        payload = await build_metrics_dashboard(client, congress_num)
    except ValueError as e:
        raise safe_service_error(e)
    except Exception as e:
        raise safe_upstream_error(e, public_message="Unable to load metrics")

    return payload


@router.get("/metrics/export")
async def export_metrics_csv(
    request: Request,
    congress: int | None = Query(None),
):
    rate_limit(
        client_ip(request),
        bucket="metrics_export",
        max_hits=10,
        window_seconds=60.0,
        detail="Too many export requests. Please try again later.",
    )
    client = request.app.state.congress_client
    congress_num = validate_congress(congress, settings.congress_number)

    try:
        payload = await build_metrics_dashboard(client, congress_num)
    except ValueError as e:
        raise safe_service_error(e)
    except Exception as e:
        raise safe_upstream_error(e, public_message="Unable to export metrics")

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
    # congress_num is validated int — safe for Content-Disposition filename
    filename = f"operation-child-shield-bill-metrics-{congress_num}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
