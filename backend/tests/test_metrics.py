from app.metrics import (
    _grade_distribution,
    _histogram_label,
    _is_not_voting,
    _mean,
    _median,
    _participated,
    _score_histogram,
    is_passing_score,
    normalize_party,
    seniority_bucket,
)
from app.scoring import VoteValue


def test_normalize_party():
    assert normalize_party("Democratic") == "Democrat"
    assert normalize_party("Republican Party") == "Republican"
    assert normalize_party("Independent") == "Independent"
    assert normalize_party("") == "Other"
    assert normalize_party("unknown") == "Other"
    assert normalize_party("Libertarian") == "Libertarian"


def test_seniority_bucket():
    assert seniority_bucket(1) == "Freshman (1 term)"
    assert seniority_bucket(2) == "2–4 terms"
    assert seniority_bucket(4) == "2–4 terms"
    assert seniority_bucket(5) == "5–8 terms"
    assert seniority_bucket(9) == "9+ terms (Senior)"


def test_is_passing_score():
    assert is_passing_score(70.0, "C-")
    assert is_passing_score(69.9, "D+")
    assert not is_passing_score(59.0, "F")
    assert not is_passing_score(80.0, "N/A")
    assert not is_passing_score(100.0, "N/A")


def test_participated_and_not_voting():
    assert _participated(VoteValue.AYE)
    assert _participated(VoteValue.NAY)
    assert not _participated(VoteValue.PRESENT)
    assert _is_not_voting(VoteValue.NOT_VOTING)
    assert _is_not_voting("Present")
    assert not _is_not_voting("Aye")


def test_histogram_label():
    assert _histogram_label(0, 10) == "0–9%"
    assert _histogram_label(90, 100) == "90–100%"


def test_mean_and_median():
    assert _mean([]) is None
    assert _median([]) is None
    assert _mean([80.0, 90.0]) == 85.0
    assert _median([80.0, 90.0, 100.0]) == 90.0


def test_grade_distribution():
    members = [
        {"gradeBucket": "A"},
        {"gradeBucket": "A"},
        {"gradeBucket": "F"},
    ]
    dist = _grade_distribution(members)
    assert dist["A"]["count"] == 2
    assert dist["A"]["percent"] == 66.7
    assert dist["F"]["count"] == 1


def test_score_histogram_bins_scores():
    bins = _score_histogram([5.0, 15.0, 95.0, 100.0])
    assert bins[0]["count"] == 1
    assert bins[1]["count"] == 1
    assert bins[-1]["count"] == 2