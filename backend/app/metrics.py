"""Aggregate legislative metrics - bill-level facts only, no member grades or rankings."""

from __future__ import annotations

import asyncio
import statistics
from collections import defaultdict
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
    serialize_report_card,
)

SENIORITY_BUCKETS = ("Freshman (1 term)", "2-4 terms", "5-8 terms", "9+ terms (Senior)")

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

GRADE_BUCKETS = ("A", "B", "C", "D", "F", "N/A")


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
    return letter_grade[0].upper() != "F"


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
        return f"{low}-100%"
    return f"{low}-{high - 1}%"


def _mean(values: list[float]) -> float | None:
    return round(statistics.mean(values), 1) if values else None


def _median(values: list[float]) -> float | None:
    return round(statistics.median(values), 1) if values else None


def _grade_distribution(members: list[dict[str, Any]]) -> dict[str, dict[str, float | int]]:
    from collections import Counter

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


def _vote_cast_bucket(vote_cast: VoteValue | str) -> str:
    if isinstance(vote_cast, VoteValue):
        if vote_cast == VoteValue.AYE:
            return "yes"
        if vote_cast == VoteValue.NAY:
            return "no"
        if vote_cast == VoteValue.NOT_VOTING:
            return "notVoting"
        if vote_cast == VoteValue.PRESENT:
            return "present"
        return "unknown"

    v = str(vote_cast).lower()
    if v in ("aye", "yea", "yes"):
        return "yes"
    if v in ("nay", "no"):
        return "no"
    if v == "not voting":
        return "notVoting"
    if v == "present":
        return "present"
    return "unknown"


def _policy_consistent_from_vote(vote: dict[str, Any]) -> bool | None:
    policy = vote.get("policy_consistent")
    if policy is True or policy is False:
        return policy

    impact = str(vote.get("score_impact") or "").lower()
    if "consistent with ocs" in impact:
        return "not consistent" not in impact
    return None


def _build_member_record(
    directory_member: dict[str, Any],
    card_data: dict[str, Any] | None,
) -> dict[str, Any]:
    votes_tracked = int((card_data or {}).get("votes_tracked", 0))
    key_votes: list[dict[str, Any]] = (card_data or {}).get("key_votes", [])

    recorded_votes = 0
    policy_consistent_votes = 0
    policy_not_consistent_votes = 0
    votes_participated = 0
    not_voting_count = 0

    for vote in key_votes:
        policy = _policy_consistent_from_vote(vote)
        if policy is not None:
            recorded_votes += 1
            if policy:
                policy_consistent_votes += 1
            else:
                policy_not_consistent_votes += 1

        cast = vote.get("vote_cast", "")
        if _participated(cast):
            votes_participated += 1
        if _is_not_voting(cast):
            not_voting_count += 1

    return {
        "bioguideId": directory_member["bioguideId"],
        "name": directory_member["name"],
        "chamber": directory_member["chamber"],
        "state": directory_member.get("state", ""),
        "stateCode": directory_member.get("stateCode", ""),
        "keyVotes": key_votes,
        "votesTracked": votes_tracked,
        "recordedVotes": recorded_votes,
        "policyConsistentVotes": policy_consistent_votes,
        "policyNotConsistentVotes": policy_not_consistent_votes,
        "votesParticipated": votes_participated,
        "notVotingCount": not_voting_count,
    }


# Full state/territory name → postal code for heat map and state pages.
STATE_NAME_TO_CODE: dict[str, str] = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
    "District of Columbia": "DC",
    "Puerto Rico": "PR",
    "Guam": "GU",
    "Virgin Islands": "VI",
    "Northern Mariana Islands": "MP",
    "American Samoa": "AS",
}


def resolve_state_code(state_name: str, state_code: str | None = None) -> str:
    if state_code and len(str(state_code).strip()) == 2:
        return str(state_code).strip().upper()
    name = (state_name or "").strip()
    if name in STATE_NAME_TO_CODE:
        return STATE_NAME_TO_CODE[name]
    if len(name) == 2:
        return name.upper()
    return name[:2].upper() if name else ""


def _state_summaries(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Aggregate House roll-call policy consistency by state (no rankings/grades)."""
    by_state: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for member in members:
        state = (member.get("state") or "").strip() or "Unknown"
        by_state[state].append(member)

    rows: list[dict[str, Any]] = []
    for state, group in by_state.items():
        house = [m for m in group if m.get("chamber") == "House"]
        policy_consistent = sum(int(m.get("policyConsistentVotes", 0)) for m in house)
        policy_not_consistent = sum(
            int(m.get("policyNotConsistentVotes", 0)) for m in house
        )
        recorded = policy_consistent + policy_not_consistent
        participated = sum(int(m.get("votesParticipated", 0)) for m in house)
        not_voting = sum(int(m.get("notVotingCount", 0)) for m in house)
        participation_denom = participated + not_voting

        state_code = ""
        for m in group:
            state_code = resolve_state_code(state, m.get("stateCode"))
            if state_code:
                break
        if not state_code:
            state_code = resolve_state_code(state)

        rows.append(
            {
                "state": state,
                "stateCode": state_code,
                "membersTracked": len(group),
                "houseMembersTracked": len(house),
                "houseMembersWithRecordedVotes": sum(
                    1 for m in house if int(m.get("recordedVotes", 0)) > 0
                ),
                "recordedVotes": recorded,
                "policyConsistentVotes": policy_consistent,
                "policyNotConsistentVotes": policy_not_consistent,
                "policyConsistencyRate": (
                    round((policy_consistent / recorded) * 100, 1) if recorded else None
                ),
                "votesParticipated": participated,
                "notVotingCount": not_voting,
                "participationRate": (
                    round((participated / participation_denom) * 100, 1)
                    if participation_denom
                    else None
                ),
            }
        )

    rows.sort(key=lambda row: row["state"])
    return rows


def _bill_summaries(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    scoring_bills = get_scoring_bills()
    house_members = [m for m in members if m["chamber"] == "House"]
    rows: list[dict[str, Any]] = []

    for bill in scoring_bills:
        bill_id = bill.bill_id
        eligible = 0
        participated = 0
        vote_counts = {"yes": 0, "no": 0, "notVoting": 0, "present": 0, "unknown": 0}
        policy_consistent_votes = 0
        policy_not_consistent_votes = 0

        for member in house_members:
            vote = next(
                (v for v in member["keyVotes"] if v.get("bill_id") == bill_id),
                None,
            )
            if not vote:
                continue

            policy = _policy_consistent_from_vote(vote)
            if policy is None:
                continue

            eligible += 1
            bucket = _vote_cast_bucket(vote.get("vote_cast", ""))
            vote_counts[bucket] = vote_counts.get(bucket, 0) + 1

            if _participated(vote.get("vote_cast", "")):
                participated += 1
            if policy:
                policy_consistent_votes += 1
            else:
                policy_not_consistent_votes += 1

        participation_rate = (
            round((participated / eligible) * 100, 1) if eligible else None
        )

        rows.append(
            {
                "billId": bill_id,
                "billNumber": bill.display_number,
                "billTitle": bill.title,
                "congressUrl": bill.congress_url,
                "eligibleMembers": eligible,
                "voteCounts": vote_counts,
                "participationRate": participation_rate,
                "policyConsistentVotes": policy_consistent_votes,
                "policyNotConsistentVotes": policy_not_consistent_votes,
            }
        )

    rows.sort(key=lambda row: (-(row["eligibleMembers"] or 0), row["billNumber"]))
    return rows


def _chamber_summary(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for chamber in ("House", "Senate"):
        group = [m for m in members if m["chamber"] == chamber]
        if not group:
            continue
        rows.append(
            {
                "chamber": chamber,
                "memberCount": len(group),
                "membersWithRecordedVotes": sum(
                    1 for m in group if m["recordedVotes"] > 0
                ),
                "totalRecordedVotes": sum(m["recordedVotes"] for m in group),
                "totalNotVotingInstances": sum(m["notVotingCount"] for m in group),
            }
        )
    return rows


def _compute_kpis(
    members: list[dict[str, Any]],
    bills_tracked: int,
    bills_with_roll_calls: int,
) -> dict[str, Any]:
    house = [m for m in members if m["chamber"] == "House"]
    total_recorded = sum(m["recordedVotes"] for m in members)
    total_not_voting = sum(m["notVotingCount"] for m in members)

    return {
        "totalMembersTracked": len(members),
        "houseMembersWithRecordedVotes": sum(
            1 for m in house if m["recordedVotes"] > 0
        ),
        "totalBillsTracked": bills_tracked,
        "billsWithRollCalls": bills_with_roll_calls,
        "totalRecordedFloorVotes": total_recorded,
        "totalNotVotingInstances": total_not_voting,
    }


def build_metrics_payload(members: list[dict[str, Any]], congress: int) -> dict[str, Any]:
    bills = _bill_summaries(members)
    bills_tracked = len(TRACKED_BILLS)
    bills_with_roll_calls = sum(1 for bill in bills if bill["eligibleMembers"] > 0)

    return {
        "congress": congress,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "dataSource": "Congress.gov API",
        "methodologyNote": (
            "Roll-call statistics on tracked child safety legislation, "
            "sourced from Congress.gov. State figures are House recorded "
            "votes aggregated by state."
        ),
        "kpis": _compute_kpis(members, bills_tracked, bills_with_roll_calls),
        "chamberSummary": _chamber_summary(members),
        "byState": _state_summaries(members),
        "bills": bills,
    }


async def _refresh_metrics_dashboard(
    client: CongressClient,
    congress: int,
    cache_key: str,
) -> dict[str, Any]:
    directory, _ = await build_directory(client, congress)
    sem = asyncio.Semaphore(4)

    async def load_member(dm: dict[str, Any]) -> dict[str, Any]:
        if dm["chamber"] == "Senate":
            return _build_member_record(dm, None)

        async with sem:
            try:
                async with get_report_card_semaphore():
                    card = await _refresh_member_report_card(
                        client,
                        dm["bioguideId"],
                        congress,
                        f"report_card_v13_{dm['bioguideId']}_{congress}",
                    )
                card_data = serialize_report_card(card)
            except Exception:
                card_data = None
            return _build_member_record(dm, card_data)

    member_records = await asyncio.gather(*(load_member(dm) for dm in directory))
    payload = build_metrics_payload(list(member_records), congress)
    client.cache.set(cache_key, payload)
    return payload


async def build_metrics_dashboard(
    client: CongressClient,
    congress: int,
) -> dict[str, Any]:
    cache_key = f"metrics_dashboard_v3_{congress}"
    cached = client.cache.get(cache_key)
    if cached is not None:
        maybe_schedule_revalidation(
            client.cache,
            cache_key,
            lambda: _refresh_metrics_dashboard(client, congress, cache_key),
        )
        return cached

    return await _refresh_metrics_dashboard(client, congress, cache_key)