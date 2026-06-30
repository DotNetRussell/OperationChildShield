from dataclasses import dataclass
from enum import Enum

from app.bills import ProtectionStance, TrackedBill
from app.utils import extract_member_contact, normalize_terms


class VoteValue(str, Enum):
    AYE = "Aye"
    NAY = "Nay"
    PRESENT = "Present"
    NOT_VOTING = "Not Voting"
    UNKNOWN = "Unknown"


@dataclass
class MemberVoteRecord:
    bill_id: str
    bill_title: str
    bill_number: str
    category: str
    vote_cast: VoteValue
    vote_date: str | None
    vote_question: str | None
    vote_result: str | None
    congress_url: str
    roll_call_url: str | None
    score_impact: str
    points_earned: float
    points_possible: float


@dataclass
class MemberContact:
    office_address: str | None
    phone: str | None
    city: str | None
    zip_code: str | None
    website_url: str | None


@dataclass
class ReportCard:
    bioguide_id: str
    name: str
    chamber: str
    state: str
    party: str
    district: str | None
    image_url: str | None
    score_percent: float
    letter_grade: str
    votes_tracked: int
    votes_scored: int
    key_votes: list[MemberVoteRecord]
    congress_profile_url: str
    contact: MemberContact | None = None


def normalize_vote(vote_str: str | None) -> VoteValue:
    if not vote_str:
        return VoteValue.UNKNOWN
    mapping = {
        "aye": VoteValue.AYE,
        "yea": VoteValue.AYE,
        "yeas": VoteValue.AYE,
        "yes": VoteValue.AYE,
        "yay": VoteValue.AYE,
        "nay": VoteValue.NAY,
        "no": VoteValue.NAY,
        "present": VoteValue.PRESENT,
        "not voting": VoteValue.NOT_VOTING,
    }
    return mapping.get(vote_str.lower().strip(), VoteValue.UNKNOWN)


def score_vote(vote: VoteValue, stance: ProtectionStance) -> tuple[float, float, str]:
    """Return (points_earned, points_possible, impact_description)."""
    if vote == VoteValue.UNKNOWN:
        return 0.0, 0.0, "No vote recorded — not counted in score"

    if vote == VoteValue.NOT_VOTING:
        return 0.0, 1.0, "Did not vote — counted against protection score"

    if vote == VoteValue.PRESENT:
        return 0.0, 1.0, "Present but did not vote — counted against protection score"

    if stance == ProtectionStance.PROTECTION:
        if vote == VoteValue.AYE:
            return 1.0, 1.0, "Voted to protect children"
        return 0.0, 1.0, "Voted against child protection measure"

    # anti_protection stance: Nay is the pro-protection vote
    if vote == VoteValue.NAY:
        return 1.0, 1.0, "Voted to protect children"
    return 0.0, 1.0, "Voted against child protection measure"


def percent_to_grade(percent: float) -> str:
    if percent >= 97:
        return "A+"
    if percent >= 93:
        return "A"
    if percent >= 90:
        return "A-"
    if percent >= 87:
        return "B+"
    if percent >= 83:
        return "B"
    if percent >= 80:
        return "B-"
    if percent >= 77:
        return "C+"
    if percent >= 73:
        return "C"
    if percent >= 70:
        return "C-"
    if percent >= 67:
        return "D+"
    if percent >= 63:
        return "D"
    if percent >= 60:
        return "D-"
    return "F"


def build_report_card(
    member: dict,
    vote_records: list[MemberVoteRecord],
) -> ReportCard:
    total_earned = sum(v.points_earned for v in vote_records)
    total_possible = sum(v.points_possible for v in vote_records)

    if total_possible > 0:
        percent = round((total_earned / total_possible) * 100, 1)
    else:
        percent = 0.0

    terms = normalize_terms(member)
    current_term = terms[-1] if terms else {}

    chamber = current_term.get("chamber", "Unknown")
    if "House" in chamber:
        chamber = "House"
    elif "Senate" in chamber:
        chamber = "Senate"

    bioguide = member.get("bioguideId", "")
    depiction = member.get("depiction", {}) or {}

    return ReportCard(
        bioguide_id=bioguide,
        name=member.get("directOrderName") or member.get("invertedOrderName", "Unknown"),
        chamber=chamber,
        state=member.get("state", current_term.get("stateName", "")),
        party=(
            member.get("partyName")
            or member.get("party")
            or current_term.get("partyName")
            or "Unknown"
        ),
        district=str(member.get("district", "")) if member.get("district") is not None else None,
        image_url=depiction.get("imageUrl"),
        score_percent=percent,
        letter_grade=percent_to_grade(percent) if total_possible > 0 else "N/A",
        votes_tracked=len(vote_records),
        votes_scored=int(total_possible),
        key_votes=vote_records,
        congress_profile_url=f"https://www.congress.gov/member/{member.get('firstName', '').lower()}-{member.get('lastName', '').lower()}/{bioguide}",
        contact=extract_member_contact(member),
    )


def resolve_bill_url(_vote_meta: dict | None, bill: TrackedBill) -> str:
    """Always use the tracked bill's congress+number URL (verified in bills.py)."""
    return bill.congress_url


def roll_call_url(congress: int, session: int, roll_call: str | int | None) -> str | None:
    if not roll_call:
        return None
    return f"https://www.congress.gov/votes/house/{congress}-{session}/{roll_call}"


def member_vote_from_roll_call(
    bill: TrackedBill,
    vote_meta: dict,
    member_vote: dict,
    congress: int,
    session: int,
) -> MemberVoteRecord:
    vote_cast = normalize_vote(member_vote.get("voteCast"))
    earned, possible, impact = score_vote(vote_cast, bill.stance)

    roll_call = vote_meta.get("rollCallNumber", "")

    return MemberVoteRecord(
        bill_id=bill.bill_id,
        bill_title=bill.title,
        bill_number=bill.display_number,
        category=bill.category.value,
        vote_cast=vote_cast,
        vote_date=vote_meta.get("startDate"),
        vote_question=vote_meta.get("voteQuestion"),
        vote_result=vote_meta.get("result"),
        congress_url=resolve_bill_url(vote_meta, bill),
        roll_call_url=roll_call_url(congress, session, roll_call),
        score_impact=impact,
        points_earned=earned,
        points_possible=possible,
    )


def absent_vote_record(
    bill: TrackedBill,
    vote_meta: dict,
    congress: int,
    session: int,
) -> MemberVoteRecord:
    """Member was in the House but has no roll-call entry — counts as not voting."""
    earned, possible, impact = score_vote(VoteValue.NOT_VOTING, bill.stance)
    roll_call = vote_meta.get("rollCallNumber", "")

    return MemberVoteRecord(
        bill_id=bill.bill_id,
        bill_title=bill.title,
        bill_number=bill.display_number,
        category=bill.category.value,
        vote_cast=VoteValue.NOT_VOTING,
        vote_date=vote_meta.get("startDate"),
        vote_question=vote_meta.get("voteQuestion"),
        vote_result=vote_meta.get("result"),
        congress_url=resolve_bill_url(vote_meta, bill),
        roll_call_url=roll_call_url(congress, session, roll_call),
        score_impact=impact,
        points_earned=earned,
        points_possible=possible,
    )


def unscored_bill_record(bill: TrackedBill) -> MemberVoteRecord:
    """Tracked bill with no House floor vote yet — not counted in score."""
    return MemberVoteRecord(
        bill_id=bill.bill_id,
        bill_title=bill.title,
        bill_number=bill.display_number,
        category=bill.category.value,
        vote_cast=VoteValue.UNKNOWN,
        vote_date=None,
        vote_question=None,
        vote_result=None,
        congress_url=bill.congress_url,
        roll_call_url=None,
        score_impact="No floor vote on this bill yet — not counted in score",
        points_earned=0.0,
        points_possible=0.0,
    )