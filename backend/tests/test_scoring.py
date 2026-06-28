import pytest

from app.bills import ProtectionStance
from app.scoring import VoteValue, normalize_vote, percent_to_grade, score_vote


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
    e, p, impact = score_vote(vote, stance)
    assert e == earned
    assert p == possible
    assert impact


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