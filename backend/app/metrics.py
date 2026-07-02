"""Aggregate congressional metrics for the transparency dashboard."""

from __future__ import annotations

import asyncio
import statistics
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

from app.bills import TRACKED_BILLS, get_scoring_bills
from app.cache_refresh import maybe_schedule_revalidation
from app.congress_client import CongressClient
from app.rate_limit import get_report_card_semaphore
from app.scoring import VoteValue
from app.services import (
    _refresh_member_report_card,
    build_directory,
    grade_bucket,
    serialize_report_card,
)
from app.utils import normalize_terms

GRADE_BUCKETS = ("A", "B", "C", "D", "F", "N/A")
SENIORITY_BUCKETS = ("Freshman (1 term)", "2–4 terms", "5–8 terms", "9+ terms (Senior)")
REGIONS = ("Northeast", "South", "Midwest", "West", "Other")

STATE_TO_REGION: dict[str, str] = {
    "Connecticut": "Northeast",
    "Maine": "Northeast",
    "Massachusetts": "Northeast",
    "New Hampshire": "Northeast",
    "Rhode Island": "Northeast",
    "Vermont": "Northeast",
    "New Jersey": "Northeast",
    "New York": "Northeast",
    "Pennsylvania": "Northeast",
    "Delaware": "Northeast",
    "Maryland": "Northeast",
    "District of Columbia": "Northeast",
    "Alabama": "South",
    "Arkansas": "South",
    "Florida": "South",
    "Georgia": "South",
    "Kentucky": "South",
    "Louisiana": "South",
    "Mississippi": "South",
    "North Carolina": "South",
    "South Carolina": "South",
    "Tennessee": "South",
    "Texas": "South",
    "Virginia": "South",
    "West Virginia": "South",
    "Oklahoma": "South",
    "Illinois": "Midwest",
    "Indiana": "Midwest",
    "Iowa": "Midwest",
    "Kansas": "Midwest",
    "Michigan": "Midwest",
    "Minnesota": "Midwest",
    "Missouri": "Midwest",
    "Nebraska": "Midwest",
    "North Dakota": "Midwest",
    "Ohio": "Midwest",
    "South Dakota": "Midwest",
    "Wisconsin": "Midwest",
    "Alaska": "West",
    "Arizona": "West",
    "California": "West",
    "Colorado": "West",
    "Hawaii": "West",
    "Idaho": "West",
    "Montana": "West",
    "Nevada": "West",
    "New Mexico": "West",
    "Oregon": "West",
    "Utah": "West",
    "Washington": "West",
    "Wyoming": "West",
}

HISTOGRAM_BUCKETS = [
    (0, 10),
    (10, 20),
    (20, 30),
    (30, 40),
    (40, 50),
    (50, 60),
    (60, 70),
    (70, 80),
    (80, 90),
    (90, 100),
]


def normalize_party(party: str) -> str:
    p = (party or "").strip().lower()
    if "democrat" in p:
        return "Democrat"
    if "republican" in p:
        return "Republican"
    if "independent" in p:
        return "Independent"
    if not p or p == "unknown":
        return "Other"
    return party.strip()


def seniority_bucket(term_count: int) -> str:
    if term_count <= 1:
        return SENIORITY_BUCKETS[0]
    if term_count <= 4:
        return SENIORITY_BUCKETS[1]
    if term_count <= 8:
        return SENIORITY_BUCKETS[2]
    return SENIORITY_BUCKETS[3]


def is_passing_score(score_percent: float, letter_grade: str) -> bool:
    if letter_grade == "N/A":
        return False
    return grade_bucket(letter_grade) != "F"


def _participated(vote_cast: VoteValue | str) -> bool:
    if isinstance(vote_cast, VoteValue):
        return vote_cast in (VoteValue.AYE, VoteValue.NAY)
    return str(vote_cast).lower() in ("aye", "nay", "yea", "yes", "no")


def _is_not_voting(vote_cast: VoteValue | str) -> bool:
    if isinstance(vote_cast, VoteValue):
        return vote_cast in (VoteValue.NOT_VOTING, VoteValue.PRESENT)
    v = str(vote_cast).lower()
    return v in ("not voting", "present")


def _histogram_label(low: int, high: int) -> str:
    if high >= 100:
        return f"{low}–100%"
    return f"{low}–{high - 1}%"


def _mean(values: list[float]) -> float | None:
    return round(statistics.mean(values), 1) if values else None


def _median(values: list[float]) -> float | None:
    return round(statistics.median(values), 1) if values else None


def _grade_distribution(members: list[dict[str, Any]]) -> dict[str, dict[str, float | int]]:
    counts = Counter(m["gradeBucket"] for m in members)
    total = len(members) or 1
    return {
        bucket: {
            "count": counts.get(bucket, 0),
            "percent": round((counts.get(bucket, 0) / total) * 100, 1),
        }
        for bucket in GRADE_BUCKETS
    }


def _score_histogram(scores: list[float]) -> list[dict[str, Any]]:
    bins = []
    for low, high in HISTOGRAM_BUCKETS:
        if high >= 100:
            count = sum(1 for s in scores if low <= s <= 100)
        else:
            count = sum(1 for s in scores if low <= s < high)
        bins.append({"label": _histogram_label(low, high), "count": count})
    return bins


def _performer_row(member: dict[str, Any]) -> dict[str, Any]:
    return {
        "bioguideId": member["bioguideId"],
        "name": member["name"],
        "party": member["partyNormalized"],
        "state": member["state"],
        "stateCode": member["stateCode"],
        "chamber": member["chamber"],
        "scorePercent": member["scorePercent"],
        "letterGrade": member["letterGrade"],
        "imageUrl": member.get("imageUrl"),
        "congressUrl": member["congressUrl"],
    }


def _group_avg_score(members: list[dict[str, Any]]) -> float | None:
    scored = [m["scorePercent"] for m in members if m["letterGrade"] != "N/A"]
    return _mean(scored)


def _group_participation_rate(members: list[dict[str, Any]]) -> float | None:
    rates = [m["participationRate"] for m in members if m["votesScored"] > 0]
    return _mean(rates)


def _build_member_record(
    directory_member: dict[str, Any],
    card_data: dict[str, Any] | None,
    raw_member: dict[str, Any] | None = None,
) -> dict[str, Any]:
    terms = normalize_terms(raw_member or {})
    term_count = max(len(terms), 1)
    letter_grade = "N/A"
    score_percent = 0.0
    votes_scored = 0
    votes_participated = 0
    not_voting_count = 0
    key_votes: list[dict[str, Any]] = []

    if card_data:
        letter_grade = card_data.get("letter_grade", "N/A")
        score_percent = float(card_data.get("score_percent", 0.0))
        votes_scored = int(card_data.get("votes_scored", 0))
        key_votes = card_data.get("key_votes", [])
        for vote in key_votes:
            if float(vote.get("points_possible", 0)) <= 0:
                continue
            cast = vote.get("vote_cast", "")
            if _participated(cast):
                votes_participated += 1
            if _is_not_voting(cast):
                not_voting_count += 1

    participation_rate = (
        round((votes_participated / votes_scored) * 100, 1) if votes_scored > 0 else 0.0
    )

    party_raw = directory_member.get("party") or (card_data or {}).get("party", "")
    state = directory_member.get("state", "")

    return {
        "bioguideId": directory_member["bioguideId"],
        "name": directory_member["name"],
        "chamber": directory_member["chamber"],
        "state": state,
        "stateCode": directory_member.get("stateCode", ""),
        "region": STATE_TO_REGION.get(state, "Other"),
        "party": party_raw,
        "partyNormalized": normalize_party(party_raw),
        "district": directory_member.get("district"),
        "imageUrl": directory_member.get("imageUrl"),
        "letterGrade": letter_grade,
        "gradeBucket": grade_bucket(letter_grade),
        "scorePercent": score_percent,
        "votesScored": votes_scored,
        "votesParticipated": votes_participated,
        "notVotingCount": not_voting_count,
        "participationRate": participation_rate,
        "termCount": term_count,
        "seniorityBucket": seniority_bucket(term_count),
        "passingGrade": is_passing_score(score_percent, letter_grade),
        "congressUrl": directory_member.get("congressUrl", ""),
        "keyVotes": key_votes,
    }


def _bill_insights(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    scoring_bills = get_scoring_bills()
    house_members = [m for m in members if m["chamber"] == "House"]
    insights: list[dict[str, Any]] = []

    for bill in scoring_bills:
        bill_id = bill.bill_id
        eligible = 0
        participated = 0
        not_voting = 0
        protection_votes = 0
        dem_protection = 0
        dem_total = 0
        rep_protection = 0
        rep_total = 0
        points_earned: list[float] = []

        for member in house_members:
            vote = next(
                (v for v in member["keyVotes"] if v.get("bill_id") == bill_id),
                None,
            )
            if not vote or float(vote.get("points_possible", 0)) <= 0:
                continue

            eligible += 1
            cast = vote.get("vote_cast", "")
            earned = float(vote.get("points_earned", 0))
            points_earned.append(earned)

            if _participated(cast):
                participated += 1
            if _is_not_voting(cast):
                not_voting += 1
            if earned >= 1.0:
                protection_votes += 1

            party = member["partyNormalized"]
            if party == "Democrat":
                dem_total += 1
                if earned >= 1.0:
                    dem_protection += 1
            elif party == "Republican":
                rep_total += 1
                if earned >= 1.0:
                    rep_protection += 1

        participation_rate = round((participated / eligible) * 100, 1) if eligible else 0.0
        not_voting_rate = round((not_voting / eligible) * 100, 1) if eligible else 0.0
        avg_impact = _mean(points_earned) or 0.0
        dem_rate = round((dem_protection / dem_total) * 100, 1) if dem_total else None
        rep_rate = round((rep_protection / rep_total) * 100, 1) if rep_total else None
        bipartisan_gap = (
            abs(dem_rate - rep_rate)
            if dem_rate is not None and rep_rate is not None
            else None
        )
        bipartisan_support = (
            round(100 - bipartisan_gap, 1)
            if bipartisan_gap is not None
            else None
        )

        insights.append(
            {
                "billId": bill_id,
                "billNumber": bill.display_number,
                "billTitle": bill.title,
                "congressUrl": bill.congress_url,
                "eligibleMembers": eligible,
                "participationRate": participation_rate,
                "notVotingRate": not_voting_rate,
                "avgScoreImpact": round(avg_impact * 100, 1),
                "protectionVoteRate": round((protection_votes / eligible) * 100, 1)
                if eligible
                else 0.0,
                "democratProtectionRate": dem_rate,
                "republicanProtectionRate": rep_rate,
                "bipartisanSupport": bipartisan_support,
            }
        )

    insights.sort(key=lambda b: b["participationRate"], reverse=True)
    return insights


def _state_breakdown(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_state: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for member in members:
        if member["chamber"] != "House":
            continue
        by_state[member["state"]].append(member)

    rows: list[dict[str, Any]] = []
    for state, group in by_state.items():
        scored = [m for m in group if m["letterGrade"] != "N/A"]
        passing = [m for m in scored if m["passingGrade"]]
        rows.append(
            {
                "state": state,
                "stateCode": group[0].get("stateCode", ""),
                "region": STATE_TO_REGION.get(state, "Other"),
                "memberCount": len(group),
                "scoredCount": len(scored),
                "avgScore": _group_avg_score(group),
                "participationRate": _group_participation_rate(group),
                "passingPercent": round((len(passing) / len(scored)) * 100, 1)
                if scored
                else 0.0,
                "notVotingInstances": sum(m["notVotingCount"] for m in group),
            }
        )

    rows.sort(
        key=lambda r: (r["avgScore"] is None, -(r["avgScore"] or 0)),
    )
    for idx, row in enumerate(rows, start=1):
        row["rank"] = idx
    return rows


def _region_breakdown(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_region: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for member in members:
        if member["chamber"] != "House":
            continue
        by_region[member["region"]].append(member)

    rows = []
    for region in REGIONS:
        group = by_region.get(region, [])
        if not group:
            continue
        rows.append(
            {
                "region": region,
                "memberCount": len(group),
                "avgScore": _group_avg_score(group),
                "participationRate": _group_participation_rate(group),
                "gradeDistribution": _grade_distribution(group),
            }
        )
    return rows


def _party_breakdown(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    parties = ("Democrat", "Republican", "Independent", "Other")
    rows = []
    for party in parties:
        group = [m for m in members if m["partyNormalized"] == party and m["chamber"] == "House"]
        if not group:
            continue
        scored = sorted(
            [m for m in group if m["letterGrade"] != "N/A"],
            key=lambda m: m["scorePercent"],
            reverse=True,
        )
        rows.append(
            {
                "party": party,
                "memberCount": len(group),
                "avgScore": _group_avg_score(group),
                "participationRate": _group_participation_rate(group),
                "notVotingInstances": sum(m["notVotingCount"] for m in group),
                "gradeDistribution": _grade_distribution(group),
                "topPerformers": [_performer_row(m) for m in scored[:5]],
                "bottomPerformers": [_performer_row(m) for m in reversed(scored[-5:])],
            }
        )
    return rows


def _chamber_breakdown(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for chamber in ("House", "Senate"):
        group = [m for m in members if m["chamber"] == chamber]
        if not group:
            continue
        rows.append(
            {
                "chamber": chamber,
                "memberCount": len(group),
                "avgScore": _group_avg_score(group),
                "participationRate": _group_participation_rate(group),
                "notVotingInstances": sum(m["notVotingCount"] for m in group),
                "gradeDistribution": _grade_distribution(group),
                "scoredCount": sum(1 for m in group if m["letterGrade"] != "N/A"),
            }
        )
    return rows


def _seniority_breakdown(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    house = [m for m in members if m["chamber"] == "House"]
    for bucket in SENIORITY_BUCKETS:
        group = [m for m in house if m["seniorityBucket"] == bucket]
        if not group:
            continue
        rows.append(
            {
                "bucket": bucket,
                "memberCount": len(group),
                "avgScore": _group_avg_score(group),
                "participationRate": _group_participation_rate(group),
            }
        )
    return rows


def _non_voting_analysis(
    members: list[dict[str, Any]],
    bill_insights: list[dict[str, Any]],
) -> dict[str, Any]:
    house = [m for m in members if m["chamber"] == "House" and m["votesScored"] > 0]
    total_scored_votes = sum(m["votesScored"] for m in house)
    total_not_voting = sum(m["notVotingCount"] for m in house)

    member_rates = []
    for member in house:
        if member["votesScored"] <= 0:
            continue
        rate = round((member["notVotingCount"] / member["votesScored"]) * 100, 1)
        member_rates.append({**_performer_row(member), "notVotingRate": rate})

    member_rates.sort(key=lambda m: m["notVotingRate"], reverse=True)

    scatter = [
        {
            "bioguideId": m["bioguideId"],
            "name": m["name"],
            "scorePercent": m["scorePercent"],
            "missedVotes": m["notVotingCount"],
        }
        for m in house
    ]

    bills_by_nv = sorted(bill_insights, key=lambda b: b["notVotingRate"], reverse=True)

    return {
        "overallNotVotingRate": round((total_not_voting / total_scored_votes) * 100, 1)
        if total_scored_votes
        else 0.0,
        "totalNotVotingInstances": total_not_voting,
        "avgMissedVotesPerMember": round(total_not_voting / len(house), 2) if house else 0.0,
        "topMembersByMissedVotes": member_rates[:10],
        "billsHighestNotVoting": bills_by_nv[:5],
        "scoreVsMissedVotes": scatter,
    }


def _compute_kpis(members: list[dict[str, Any]], bills_tracked: int, bills_scored: int) -> dict[str, Any]:
    house_scored = [m for m in members if m["chamber"] == "House" and m["letterGrade"] != "N/A"]
    scores = [m["scorePercent"] for m in house_scored]
    passing = [m for m in house_scored if m["passingGrade"]]
    participation_rates = [m["participationRate"] for m in house_scored if m["votesScored"] > 0]
    total_nv = sum(m["notVotingCount"] for m in members)

    return {
        "avgProtectionScore": _mean(scores),
        "totalMembersTracked": len(members),
        "houseMembersScored": len(house_scored),
        "totalBillsTracked": bills_tracked,
        "totalBillsScored": bills_scored,
        "avgParticipationRate": _mean(participation_rates),
        "passingGradePercent": round((len(passing) / len(house_scored)) * 100, 1)
        if house_scored
        else 0.0,
        "totalNotVotingInstances": total_nv,
    }


def _top_bottom_performers(members: list[dict[str, Any]]) -> dict[str, Any]:
    house_scored = sorted(
        [m for m in members if m["chamber"] == "House" and m["letterGrade"] != "N/A"],
        key=lambda m: m["scorePercent"],
        reverse=True,
    )
    perfect_participation = [
        m
        for m in house_scored
        if m["votesScored"] > 0 and m["votesParticipated"] == m["votesScored"]
    ]
    near_perfect = [m for m in house_scored if m["scorePercent"] >= 97]

    return {
        "top10": [_performer_row(m) for m in house_scored[:10]],
        "bottom10": [_performer_row(m) for m in reversed(house_scored[-10:])],
        "nearPerfectScores": [_performer_row(m) for m in near_perfect[:10]],
        "perfectParticipation": [_performer_row(m) for m in perfect_participation[:10]],
    }


def build_metrics_payload(members: list[dict[str, Any]], congress: int) -> dict[str, Any]:
    house_scored = [m for m in members if m["chamber"] == "House" and m["letterGrade"] != "N/A"]
    scores = [m["scorePercent"] for m in house_scored]
    bills_tracked = len(TRACKED_BILLS)
    bills_scored = len(get_scoring_bills())
    bill_insights = _bill_insights(members)
    state_breakdown = _state_breakdown(members)

    # Strip heavy keyVotes from member export — keep summary fields only
    member_export = []
    for m in members:
        entry = {k: v for k, v in m.items() if k != "keyVotes"}
        member_export.append(entry)

    return {
        "congress": congress,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "dataSource": "Congress.gov API",
        "scoringNote": (
            "Protection Scores are calculated from House roll-call votes only. "
            "Senate members and voice-vote bills are tracked but not individually scored."
        ),
        "kpis": _compute_kpis(members, bills_tracked, bills_scored),
        "scoreDistribution": {
            "gradeBuckets": _grade_distribution(house_scored),
            "histogram": _score_histogram(scores),
            "mean": _mean(scores),
            "median": _median(scores),
        },
        "byParty": _party_breakdown(members),
        "byChamber": _chamber_breakdown(members),
        "byState": state_breakdown,
        "byRegion": _region_breakdown(members),
        "bySeniority": _seniority_breakdown(members),
        "nonVoting": _non_voting_analysis(members, bill_insights),
        "performers": _top_bottom_performers(members),
        "billInsights": bill_insights,
        "stateRankings": {
            "top5": state_breakdown[:5],
            "bottom5": list(reversed(state_breakdown[-5:])),
        },
        "members": member_export,
        "filterOptions": {
            "chambers": ["House", "Senate"],
            "parties": sorted({m["partyNormalized"] for m in members}),
            "states": sorted({m["state"] for m in members if m["state"]}),
            "regions": list(REGIONS),
            "seniorityBuckets": list(SENIORITY_BUCKETS),
            "gradeBuckets": list(GRADE_BUCKETS),
        },
    }


async def _refresh_metrics_dashboard(
    client: CongressClient,
    congress: int,
    cache_key: str,
) -> dict[str, Any]:
    directory, _ = await build_directory(client, congress)
    sem = asyncio.Semaphore(4)

    async def load_member(dm: dict[str, Any]) -> dict[str, Any]:
        try:
            raw_member = await client.get_member(dm["bioguideId"])
        except Exception:
            raw_member = {}

        if dm["chamber"] == "Senate":
            return _build_member_record(dm, None, raw_member)

        async with sem:
            try:
                async with get_report_card_semaphore():
                    card = await _refresh_member_report_card(
                        client,
                        dm["bioguideId"],
                        congress,
                        f"report_card_v12_{dm['bioguideId']}_{congress}",
                    )
                card_data = serialize_report_card(card)
            except Exception:
                card_data = None
            return _build_member_record(dm, card_data, raw_member)

    member_records = await asyncio.gather(*(load_member(dm) for dm in directory))
    payload = build_metrics_payload(list(member_records), congress)
    client.cache.set(cache_key, payload)
    return payload


async def build_metrics_dashboard(
    client: CongressClient,
    congress: int,
) -> dict[str, Any]:
    cache_key = f"metrics_dashboard_v1_{congress}"
    cached = client.cache.get(cache_key)
    if cached is not None:
        maybe_schedule_revalidation(
            client.cache,
            cache_key,
            lambda: _refresh_metrics_dashboard(client, congress, cache_key),
        )
        return cached

    return await _refresh_metrics_dashboard(client, congress, cache_key)