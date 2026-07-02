import pytest

from app.bills import ProtectionStance, get_bill_by_id, get_scoring_bills
from app.scoring import (
    VoteValue,
    absent_vote_record,
    build_report_card,
    member_vote_from_roll_call,
    normalize_vote,
    percent_to_grade,
    roll_call_url,
    score_vote,
    unscored_bill_record,
)


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("Aye", VoteValue.AYE),
        ("YEA", VoteValue.AYE),
        ("yes", VoteValue.AYE),
        ("Nay", VoteValue.NAY),
        ("no", VoteValue.NAY),
        ("Present", VoteValue.PRESENT),
        ("Not Voting", VoteValue.NOT_VOTING),
        ("", VoteValue.UNKNOWN),
        (None, VoteValue.UNKNOWN),
        ("abstain", VoteValue.UNKNOWN),
    ],
)
def test_normalize_vote(raw, expected):
    assert normalize_vote(raw) == expected


@pytest.mark.parametrize(
    "vote,stance,earned,possible",
    [
        (VoteValue.UNKNOWN, ProtectionStance.PROTECTION, 0.0, 0.0),
        (VoteValue.AYE, ProtectionStance.PROTECTION, 1.0, 1.0),
        (VoteValue.NAY, ProtectionStance.PROTECTION, 0.0, 1.0),
        (VoteValue.PRESENT, ProtectionStance.PROTECTION, 0.0, 1.0),
        (VoteValue.NOT_VOTING, ProtectionStance.PROTECTION, 0.0, 1.0),
        (VoteValue.NAY, ProtectionStance.ANTI_PROTECTION, 1.0, 1.0),
        (VoteValue.AYE, ProtectionStance.ANTI_PROTECTION, 0.0, 1.0),
    ],
)
def test_score_vote(vote, stance, earned, possible):
    e, p, impact, policy_consistent = score_vote(vote, stance)
    assert e == earned
    assert p == possible
    assert impact
    if possible <= 0:
        assert policy_consistent is None
    else:
        assert policy_consistent == (earned > 0)


@pytest.mark.parametrize(
    "percent,grade",
    [
        (100.0, "A+"),
        (97.0, "A+"),
        (96.9, "A"),
        (93.0, "A"),
        (90.0, "A-"),
        (80.0, "B-"),
        (70.0, "C-"),
        (60.0, "D-"),
        (59.9, "F"),
        (0.0, "F"),
    ],
)
def test_percent_to_grade(percent, grade):
    assert percent_to_grade(percent) == grade


def test_roll_call_url():
    assert roll_call_url(119, 1, 198) == "https://www.congress.gov/votes/house/119-1/198"
    assert roll_call_url(119, 1, None) is None
    assert roll_call_url(119, 1, "") is None


def test_member_vote_from_roll_call_protection_bill():
    bill = get_scoring_bills()[0]
    vote_meta = {
        "rollCallNumber": 42,
        "startDate": "2025-01-15",
        "voteQuestion": "On Passage",
        "result": "Passed",
    }
    record = member_vote_from_roll_call(
        bill,
        vote_meta,
        {"voteCast": "Aye"},
        bill.congress,
        1,
    )
    assert record.vote_cast == VoteValue.AYE
    assert record.points_earned == 1.0
    assert record.points_possible == 1.0
    assert record.roll_call_url == roll_call_url(bill.congress, 1, 42)


def test_absent_vote_record_counts_against_score():
    bill = get_scoring_bills()[0]
    record = absent_vote_record(
        bill,
        {"rollCallNumber": 10, "startDate": "2025-01-01"},
        bill.congress,
        1,
    )
    assert record.vote_cast == VoteValue.NOT_VOTING
    assert record.points_earned == 0.0
    assert record.points_possible == 1.0


def test_unscored_bill_record_has_zero_points():
    bill = get_bill_by_id("119-s-1748")
    assert bill is not None
    record = unscored_bill_record(bill)
    assert record.vote_cast == VoteValue.UNKNOWN
    assert record.points_earned == 0.0
    assert record.points_possible == 0.0
    assert "no floor vote" in record.score_impact.lower()


def test_build_report_card_computes_grade_from_votes():
    bill = get_scoring_bills()[0]
    votes = [
        member_vote_from_roll_call(
            bill,
            {"rollCallNumber": 1, "startDate": "2025-01-01"},
            {"voteCast": "Aye"},
            bill.congress,
            1,
        ),
        member_vote_from_roll_call(
            bill,
            {"rollCallNumber": 2, "startDate": "2025-02-01"},
            {"voteCast": "Nay"},
            bill.congress,
            1,
        ),
    ]
    member = {
        "bioguideId": "T000001",
        "directOrderName": "Jane Doe",
        "firstName": "Jane",
        "lastName": "Doe",
        "state": "California",
        "partyName": "Democratic",
        "district": 12,
        "terms": [
            {
                "congress": 119,
                "chamber": "House of Representatives",
                "stateName": "California",
            }
        ],
        "depiction": {"imageUrl": "https://example.com/photo.jpg"},
        "addressInformation": {"phoneNumber": "(202) 555-0100"},
    }
    card = build_report_card(member, votes)
    assert card.bioguide_id == "T000001"
    assert card.name == "Jane Doe"
    assert card.chamber == "House"
    assert card.score_percent == 50.0
    assert card.letter_grade == "F"
    assert card.votes_scored == 2
    assert card.contact is not None
    assert card.contact.phone == "(202) 555-0100"


def test_build_report_card_na_when_no_scored_votes():
    member = {
        "bioguideId": "S000001",
        "invertedOrderName": "Doe, Jane",
        "state": "California",
        "terms": [{"congress": 119, "chamber": "Senate"}],
    }
    card = build_report_card(member, [])
    assert card.chamber == "Senate"
    assert card.letter_grade == "N/A"
    assert card.score_percent == 0.0