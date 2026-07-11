from app.metrics import (
    _grade_distribution,
    _histogram_label,
    _is_not_voting,
    _mean,
    _median,
    _participated,
    _policy_consistent_from_vote,
    _score_histogram,
    _vote_cast_bucket,
    build_metrics_payload,
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
    assert seniority_bucket(2) == "2-4 terms"
    assert seniority_bucket(4) == "2-4 terms"
    assert seniority_bucket(5) == "5-8 terms"
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
    assert _histogram_label(0, 10) == "0-9%"
    assert _histogram_label(90, 100) == "90-100%"


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


def test_vote_cast_bucket():
    assert _vote_cast_bucket("Aye") == "yes"
    assert _vote_cast_bucket("Nay") == "no"
    assert _vote_cast_bucket("Not Voting") == "notVoting"


def test_policy_consistent_from_vote():
    assert _policy_consistent_from_vote({"policy_consistent": True}) is True
    assert _policy_consistent_from_vote({"policy_consistent": False}) is False
    assert (
        _policy_consistent_from_vote(
            {"score_impact": "Consistent with OCS board-adopted policy position"}
        )
        is True
    )
    assert (
        _policy_consistent_from_vote(
            {"score_impact": "Not consistent with OCS board-adopted policy position"}
        )
        is False
    )


def test_build_metrics_payload_has_no_member_rankings():
    members = [
        {
            "bioguideId": "A000001",
            "name": "Rep. Example",
            "chamber": "House",
            "state": "Texas",
            "stateCode": "TX",
            "keyVotes": [
                {
                    "bill_id": "hr6544-117",
                    "vote_cast": "Aye",
                    "policy_consistent": True,
                }
            ],
            "votesTracked": 5,
            "recordedVotes": 1,
            "policyConsistentVotes": 1,
            "policyNotConsistentVotes": 0,
            "votesParticipated": 1,
            "notVotingCount": 0,
        }
    ]

    payload = build_metrics_payload(members, 119)
    assert payload["congress"] == 119
    assert "members" not in payload
    assert "performers" not in payload
    assert "scoreDistribution" not in payload
    assert payload["kpis"]["totalMembersTracked"] == 1
    assert "bills" in payload
    assert "chamberSummary" in payload
    assert "byState" in payload
    assert payload["byState"][0]["state"] == "Texas"
    assert payload["byState"][0]["stateCode"] == "TX"
    assert payload["byState"][0]["policyConsistencyRate"] == 100.0
    assert "rank" not in payload["byState"][0]
    assert "letterGrade" not in payload["byState"][0]


def test_state_summaries_aggregate_house_votes_only():
    from app.metrics import _state_summaries, resolve_state_code

    assert resolve_state_code("California") == "CA"
    assert resolve_state_code("California", "ca") == "CA"

    members = [
        {
            "chamber": "House",
            "state": "Ohio",
            "stateCode": "OH",
            "recordedVotes": 2,
            "policyConsistentVotes": 1,
            "policyNotConsistentVotes": 1,
            "votesParticipated": 2,
            "notVotingCount": 0,
        },
        {
            "chamber": "Senate",
            "state": "Ohio",
            "stateCode": "OH",
            "recordedVotes": 0,
            "policyConsistentVotes": 5,
            "policyNotConsistentVotes": 0,
            "votesParticipated": 0,
            "notVotingCount": 0,
        },
        {
            "chamber": "House",
            "state": "Maine",
            "stateCode": "ME",
            "recordedVotes": 0,
            "policyConsistentVotes": 0,
            "policyNotConsistentVotes": 0,
            "votesParticipated": 0,
            "notVotingCount": 1,
        },
    ]

    rows = _state_summaries(members)
    by_code = {r["stateCode"]: r for r in rows}
    assert by_code["OH"]["recordedVotes"] == 2
    assert by_code["OH"]["policyConsistencyRate"] == 50.0
    assert by_code["OH"]["membersTracked"] == 2
    assert by_code["OH"]["houseMembersTracked"] == 1
    assert by_code["ME"]["policyConsistencyRate"] is None
    assert by_code["ME"]["participationRate"] == 0.0