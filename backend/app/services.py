import asyncio
from collections import Counter
from dataclasses import asdict
from typing import Any

from app.rate_limit import get_report_card_semaphore

from app.bill_verification import get_official_title
from app.bills import TRACKED_BILLS, get_report_bills, get_scoring_bills, get_tracked_bills
from app.congress_client import CongressClient
from app.utils import member_bioguide_id, normalize_terms, served_in_house_for_congress
from app.scoring import (
    MemberContact,
    MemberVoteRecord,
    ReportCard,
    absent_vote_record,
    build_report_card,
    member_vote_from_roll_call,
    unscored_bill_record,
)


def serialize_report_card(card: ReportCard) -> dict[str, Any]:
    data = asdict(card)
    data["key_votes"] = [asdict(v) for v in card.key_votes]
    if card.contact is not None:
        data["contact"] = asdict(card.contact)
    else:
        data["contact"] = None
    return data


def serialize_vote(vote: MemberVoteRecord) -> dict[str, Any]:
    return asdict(vote)


def _pick_bill_vote(
    votes: list[dict],
) -> dict | None:
    """Prefer final passage votes when a bill has multiple roll calls."""
    if not votes:
        return None
    if len(votes) == 1:
        return votes[0]

    passage = [
        v
        for v in votes
        if "pass" in (v.get("voteQuestion") or "").lower()
        or "agree" in (v.get("voteQuestion") or "").lower()
    ]
    pool = passage or votes
    return max(pool, key=lambda v: v.get("startDate") or "")


def _apply_official_title(
    record: MemberVoteRecord, official_title: str
) -> MemberVoteRecord:
    if record.bill_title == official_title:
        return record
    return MemberVoteRecord(
        bill_id=record.bill_id,
        bill_title=official_title,
        bill_number=record.bill_number,
        category=record.category,
        vote_cast=record.vote_cast,
        vote_date=record.vote_date,
        vote_question=record.vote_question,
        vote_result=record.vote_result,
        congress_url=record.congress_url,
        roll_call_url=record.roll_call_url,
        score_impact=record.score_impact,
        points_earned=record.points_earned,
        points_possible=record.points_possible,
    )


async def fetch_member_votes(
    client: CongressClient,
    member: dict[str, Any],
    bioguide_id: str,
) -> list[MemberVoteRecord]:
    records: list[MemberVoteRecord] = []
    scoring_ids = {b.bill_id for b in get_scoring_bills()}

    for bill in get_report_bills():
        official_title = await get_official_title(client, bill)

        if bill.bill_id not in scoring_ids:
            record = unscored_bill_record(bill)
            if bill.floor_status.value != "introduced":
                record = MemberVoteRecord(
                    bill_id=record.bill_id,
                    bill_title=record.bill_title,
                    bill_number=record.bill_number,
                    category=record.category,
                    vote_cast=record.vote_cast,
                    vote_date=record.vote_date,
                    vote_question=record.vote_question,
                    vote_result=record.vote_result,
                    congress_url=record.congress_url,
                    roll_call_url=record.roll_call_url,
                    score_impact=bill.floor_status_label + " — not counted in score",
                    points_earned=0.0,
                    points_possible=0.0,
                )
            records.append(_apply_official_title(record, official_title))
            continue

        try:
            house_votes = await client.find_house_votes_for_bill(
                bill.congress, bill.bill_type, bill.number
            )
        except Exception:
            house_votes = []

        vote_meta = _pick_bill_vote(house_votes)
        if not vote_meta:
            records.append(_apply_official_title(unscored_bill_record(bill), official_title))
            continue

        session = vote_meta.get("_session", vote_meta.get("sessionNumber", 1))
        roll_call = vote_meta.get("rollCallNumber")
        if not roll_call:
            records.append(_apply_official_title(unscored_bill_record(bill), official_title))
            continue

        try:
            items = await client.get_house_vote_members(
                bill.congress, int(session), int(roll_call)
            )
        except Exception:
            records.append(_apply_official_title(unscored_bill_record(bill), official_title))
            continue

        member_vote = next(
            (item for item in items if member_bioguide_id(item) == bioguide_id),
            None,
        )

        if member_vote:
            records.append(
                _apply_official_title(
                    member_vote_from_roll_call(
                        bill, vote_meta, member_vote, bill.congress, int(session)
                    ),
                    official_title,
                )
            )
        elif served_in_house_for_congress(member, bill.congress):
            records.append(
                _apply_official_title(
                    absent_vote_record(bill, vote_meta, bill.congress, int(session)),
                    official_title,
                )
            )

    return records


async def resolve_member_party(
    client: CongressClient,
    bioguide_id: str,
    congress: int,
    member: dict[str, Any],
) -> str:
    party = member.get("partyName") or member.get("party") or ""
    if party:
        return party

    terms = normalize_terms(member)
    for term in reversed(terms):
        party = term.get("partyName") or term.get("party") or ""
        if party:
            return party

    for m in await client.get_members(congress):
        if m.get("bioguideId") == bioguide_id:
            return m.get("partyName", "") or ""

    return ""


async def build_member_report_card(
    client: CongressClient,
    bioguide_id: str,
    congress: int,
) -> ReportCard:
    cache_key = f"report_card_v12_{bioguide_id}_{congress}"
    cached = client.cache.get(cache_key)
    if cached is not None:
        from app.scoring import VoteValue

        votes = []
        for v in cached.get("key_votes", []):
            entry = dict(v)
            if isinstance(entry.get("vote_cast"), str):
                try:
                    entry["vote_cast"] = VoteValue(entry["vote_cast"])
                except ValueError:
                    entry["vote_cast"] = VoteValue.UNKNOWN
            votes.append(MemberVoteRecord(**entry))
        contact_raw = cached.get("contact")
        contact = MemberContact(**contact_raw) if contact_raw else None
        data = {k: v for k, v in cached.items() if k not in ("key_votes", "contact")}
        card = ReportCard(**data, contact=contact, key_votes=votes)
        return card

    member = await client.get_member(bioguide_id)
    party = await resolve_member_party(client, bioguide_id, congress, member)
    if party:
        member = {**member, "partyName": party}
    participation = await fetch_member_votes(client, member, bioguide_id)
    scored = [v for v in participation if v.points_possible > 0]

    card = build_report_card(member, scored)
    card.key_votes = participation
    card.votes_tracked = len(participation)
    client.cache.set(cache_key, serialize_report_card(card))
    return card


def matches_grade_filter(letter_grade: str, grade_filter: str) -> bool:
    gf = grade_filter.strip().upper()
    if gf == "N/A":
        return letter_grade == "N/A"
    return letter_grade.upper().startswith(gf)


def grade_bucket(letter_grade: str) -> str:
    if letter_grade == "N/A":
        return "N/A"
    return letter_grade[0].upper()


async def get_grade_index(client: CongressClient, congress: int) -> dict[str, str]:
    cache_key = f"grade_index_v8_{congress}"
    cached = client.cache.get(cache_key)
    if cached is not None:
        return cached

    members, _ = await build_directory(client, congress)
    index: dict[str, str] = {}
    sem = asyncio.Semaphore(4)

    async def grade_member(member: dict[str, Any]) -> None:
        bid = member["bioguideId"]
        if member["chamber"] == "Senate":
            index[bid] = "N/A"
            return
        async with sem:
            try:
                async with get_report_card_semaphore():
                    card = await build_member_report_card(client, bid, congress)
                index[bid] = card.letter_grade
            except Exception:
                index[bid] = "N/A"

    await asyncio.gather(*(grade_member(m) for m in members))
    client.cache.set(cache_key, index)
    return index


GRADE_SORT_ORDER = ("F", "D", "C", "B", "A", "N/A")
GRADE_SORT_RANK = {grade: index for index, grade in enumerate(GRADE_SORT_ORDER)}
GRADE_MEMBER_SORT_RANK = {"A": 0, "B": 1, "C": 2, "D": 3, "F": 4, "N/A": 5}


def grade_sort_key(letter_grade: str) -> tuple[int, str]:
    bucket = grade_bucket(letter_grade)
    return (GRADE_MEMBER_SORT_RANK.get(bucket, 5), letter_grade)


def summarize_grade_index(index: dict[str, str]) -> dict[str, int]:
    counts = Counter(grade_bucket(g) for g in index.values())
    return {label: counts.get(label, 0) for label in GRADE_SORT_ORDER}


async def build_directory_by_grade(
    client: CongressClient,
    congress: int,
    grade: str,
    search: str | None = None,
    chamber: str | None = None,
    state: str | None = None,
    party: str | None = None,
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    members, _ = await build_directory(
        client, congress, search=search, chamber=chamber, state=state, party=party
    )
    index = await get_grade_index(client, congress)

    filtered = [
        m
        for m in members
        if matches_grade_filter(index.get(m["bioguideId"], "N/A"), grade)
    ]

    for m in filtered:
        m["letterGrade"] = index.get(m["bioguideId"], "N/A")

    filtered.sort(
        key=lambda m: (
            grade_sort_key(m["letterGrade"]),
            m["chamber"],
            m["state"],
            m["name"],
        )
    )

    total = len(filtered)
    if limit is not None:
        filtered = filtered[offset : offset + limit]
    return filtered, total


async def build_directory(
    client: CongressClient,
    congress: int,
    search: str | None = None,
    chamber: str | None = None,
    state: str | None = None,
    party: str | None = None,
    limit: int | None = None,
    offset: int = 0,
    sort: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    members = await client.get_members(congress)
    results: list[dict[str, Any]] = []

    for m in members:
        terms = normalize_terms(m)
        current = terms[-1] if terms else {}
        member_chamber = current.get("chamber", "")
        if "House" in member_chamber:
            ch = "House"
        elif "Senate" in member_chamber:
            ch = "Senate"
        else:
            ch = "Unknown"

        name = m.get("name", "")
        state_name = m.get("state", "")
        party_name = m.get("partyName", "")

        if chamber and ch.lower() != chamber.lower():
            continue
        if state and state_name.lower() != state.lower() and state.upper() != m.get("state", ""):
            if state.upper() not in state_name.upper() and state_name.upper() not in state.upper():
                continue
        if party and party.lower() not in party_name.lower():
            continue
        if search:
            q = search.lower()
            if q not in name.lower() and q not in state_name.lower():
                continue

        depiction = m.get("depiction", {}) or {}
        bioguide = m.get("bioguideId", "")

        state_code = current.get("stateCode", "")

        results.append({
            "bioguideId": bioguide,
            "name": name,
            "chamber": ch,
            "state": state_name,
            "stateCode": state_code,
            "party": party_name,
            "district": m.get("district"),
            "imageUrl": depiction.get("imageUrl"),
            "congressUrl": f"https://www.congress.gov/member/{bioguide}",
        })

    if sort == "grade":
        index = await get_grade_index(client, congress)
        for m in results:
            m["letterGrade"] = index.get(m["bioguideId"], "N/A")
        results.sort(
            key=lambda m: (
                grade_sort_key(m.get("letterGrade", "N/A")),
                m["chamber"],
                m["state"],
                m["name"],
            )
        )
    else:
        results.sort(key=lambda x: (x["chamber"], x["state"], x["name"]))

    total = len(results)
    if limit is not None:
        results = results[offset : offset + limit]
    return results, total


async def get_bills_summary(client: CongressClient) -> list[dict[str, Any]]:
    bills: list[dict[str, Any]] = []
    for b in TRACKED_BILLS:
        official_title = await get_official_title(client, b)
        bills.append(
            {
                "id": b.bill_id,
                "congress": b.congress,
                "number": b.display_number,
                "title": official_title,
                "category": b.category.value,
                "description": b.description,
                "congressUrl": b.congress_url,
                "floorStatus": b.floor_status.value,
                "floorStatusLabel": b.floor_status_label,
                "scorable": b.is_house_scorable,
            }
        )
    return bills