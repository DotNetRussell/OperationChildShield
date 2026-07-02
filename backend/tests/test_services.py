from app.bills import get_scoring_bills
from app.scoring import MemberVoteRecord, VoteValue, build_report_card
from app.services import (
    _apply_official_title,
    _pick_bill_vote,
    grade_bucket,
    grade_sort_key,
    matches_grade_filter,
    serialize_report_card,
    serialize_vote,
    summarize_grade_index,
)


def test_grade_bucket():
    assert grade_bucket("A+") == "A"
    assert grade_bucket("B-") == "B"
    assert grade_bucket("N/A") == "N/A"


def test_matches_grade_filter():
    assert matches_grade_filter("A+", "A")
    assert matches_grade_filter("B-", "B")
    assert not matches_grade_filter("C", "A")
    assert matches_grade_filter("N/A", "N/A")
    assert not matches_grade_filter("A", "N/A")


def test_summarize_grade_index():
    index = {
        "A001": "A+",
        "A002": "A-",
        "B001": "B",
        "C001": "C-",
        "D001": "D",
        "F001": "F",
        "S001": "N/A",
    }
    summary = summarize_grade_index(index)
    assert summary == {"F": 1, "D": 1, "C": 1, "B": 1, "A": 2, "N/A": 1}


def test_grade_sort_key_orders_na_last():
    assert grade_sort_key("A+") < grade_sort_key("F")
    assert grade_sort_key("F") < grade_sort_key("N/A")


def test_pick_bill_vote_returns_single_vote():
    vote = {"rollCallNumber": 1, "startDate": "2024-01-01"}
    assert _pick_bill_vote([vote]) == vote


def test_pick_bill_vote_prefers_passage_question():
    votes = [
        {"rollCallNumber": 1, "startDate": "2024-01-01", "voteQuestion": "On Motion"},
        {"rollCallNumber": 2, "startDate": "2024-02-01", "voteQuestion": "On Passage"},
    ]
    picked = _pick_bill_vote(votes)
    assert picked["rollCallNumber"] == 2


def test_pick_bill_vote_uses_latest_when_no_passage():
    votes = [
        {"rollCallNumber": 1, "startDate": "2024-01-01", "voteQuestion": "On Motion"},
        {"rollCallNumber": 2, "startDate": "2024-03-01", "voteQuestion": "On Amendment"},
    ]
    picked = _pick_bill_vote(votes)
    assert picked["rollCallNumber"] == 2


def test_pick_bill_vote_empty_returns_none():
    assert _pick_bill_vote([]) is None


def test_apply_official_title_updates_mismatched_title():
    bill = get_scoring_bills()[0]
    record = MemberVoteRecord(
        bill_id=bill.bill_id,
        bill_title="Old Title",
        bill_number=bill.display_number,
        category=bill.category.value,
        vote_cast=VoteValue.AYE,
        vote_date=None,
        vote_question=None,
        vote_result=None,
        congress_url=bill.congress_url,
        roll_call_url=None,
        score_impact="Voted to protect children",
        points_earned=1.0,
        points_possible=1.0,
    )
    updated = _apply_official_title(record, "Official Title")
    assert updated.bill_title == "Official Title"
    assert updated.points_earned == 1.0


def test_apply_official_title_noop_when_same():
    bill = get_scoring_bills()[0]
    record = MemberVoteRecord(
        bill_id=bill.bill_id,
        bill_title=bill.title,
        bill_number=bill.display_number,
        category=bill.category.value,
        vote_cast=VoteValue.AYE,
        vote_date=None,
        vote_question=None,
        vote_result=None,
        congress_url=bill.congress_url,
        roll_call_url=None,
        score_impact="Voted to protect children",
        points_earned=1.0,
        points_possible=1.0,
    )
    assert _apply_official_title(record, bill.title) is record


def test_serialize_report_card_includes_contact_and_votes():
    member = {
        "bioguideId": "T000001",
        "directOrderName": "Jane Doe",
        "firstName": "Jane",
        "lastName": "Doe",
        "state": "California",
        "partyName": "Democratic",
        "terms": [{"congress": 119, "chamber": "House of Representatives"}],
    }
    bill = get_scoring_bills()[0]
    votes = [
        MemberVoteRecord(
            bill_id=bill.bill_id,
            bill_title=bill.title,
            bill_number=bill.display_number,
            category=bill.category.value,
            vote_cast=VoteValue.AYE,
            vote_date="2025-01-01",
            vote_question="On Passage",
            vote_result="Passed",
            congress_url=bill.congress_url,
            roll_call_url="https://www.congress.gov/votes/house/119-1/1",
            score_impact="Voted to protect children",
            points_earned=1.0,
            points_possible=1.0,
        )
    ]
    card = build_report_card(member, votes)
    data = serialize_report_card(card)
    assert data["bioguide_id"] == "T000001"
    assert "score_percent" not in data
    assert "letter_grade" not in data
    assert "votes_scored" not in data
    assert len(data["key_votes"]) == 1
    assert data["key_votes"][0]["vote_cast"] == "Aye"
    assert "points_earned" not in data["key_votes"][0]
    assert data["contact"] is None or isinstance(data["contact"], dict)


def test_report_card_from_cache_handles_stripped_api_fields():
    from app.services import _report_card_from_cache

    member = {
        "bioguideId": "T000001",
        "directOrderName": "Jane Doe",
        "firstName": "Jane",
        "lastName": "Doe",
        "state": "California",
        "partyName": "Democratic",
        "terms": [{"congress": 119, "chamber": "House of Representatives"}],
    }
    bill = get_scoring_bills()[0]
    votes = [
        MemberVoteRecord(
            bill_id=bill.bill_id,
            bill_title=bill.title,
            bill_number=bill.display_number,
            category=bill.category.value,
            vote_cast=VoteValue.AYE,
            vote_date="2025-01-01",
            vote_question="On Passage",
            vote_result="Passed",
            congress_url=bill.congress_url,
            roll_call_url="https://www.congress.gov/votes/house/119-1/1",
            score_impact="Consistent with OCS board-adopted policy position",
            points_earned=1.0,
            points_possible=1.0,
            policy_consistent=True,
        )
    ]
    card = build_report_card(member, votes)
    cached = serialize_report_card(card)
    restored = _report_card_from_cache(cached)
    assert restored.bioguide_id == "T000001"
    assert len(restored.key_votes) == 1
    assert restored.key_votes[0].policy_consistent is True


def test_serialize_vote_returns_dict():
    bill = get_scoring_bills()[0]
    record = MemberVoteRecord(
        bill_id=bill.bill_id,
        bill_title=bill.title,
        bill_number=bill.display_number,
        category=bill.category.value,
        vote_cast=VoteValue.NAY,
        vote_date=None,
        vote_question=None,
        vote_result=None,
        congress_url=bill.congress_url,
        roll_call_url=None,
        score_impact="Voted against child protection measure",
        points_earned=0.0,
        points_possible=1.0,
    )
    data = serialize_vote(record)
    assert data["bill_id"] == bill.bill_id
    assert data["vote_cast"] == "Nay"
    assert "points_earned" not in data