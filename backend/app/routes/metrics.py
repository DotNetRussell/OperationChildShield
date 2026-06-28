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
            "bioguide_id",
            "name",
            "chamber",
            "state",
            "state_code",
            "region",
            "party",
            "district",
            "letter_grade",
            "score_percent",
            "votes_scored",
            "votes_participated",
            "not_voting_count",
            "participation_rate",
            "term_count",
            "seniority_bucket",
            "passing_grade",
        ]
    )

    for m in payload.get("members", []):
        writer.writerow(
            [
                m.get("bioguideId"),
                m.get("name"),
                m.get("chamber"),
                m.get("state"),
                m.get("stateCode"),
                m.get("region"),
                m.get("partyNormalized"),
                m.get("district"),
                m.get("letterGrade"),
                m.get("scorePercent"),
                m.get("votesScored"),
                m.get("votesParticipated"),
                m.get("notVotingCount"),
                m.get("participationRate"),
                m.get("termCount"),
                m.get("seniorityBucket"),
                m.get("passingGrade"),
            ]
        )

    output.seek(0)
    filename = f"operation-child-shield-metrics-{congress_num}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )