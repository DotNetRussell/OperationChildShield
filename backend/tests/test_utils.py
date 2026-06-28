from app.utils import (
    member_bioguide_id,
    normalize_terms,
    normalize_vote_results,
    served_in_house_for_congress,
)


def test_normalize_terms_list():
    member = {"terms": [{"congress": 119, "chamber": "House of Representatives"}]}
    assert len(normalize_terms(member)) == 1


def test_normalize_terms_dict_with_item():
    member = {
        "terms": {
            "item": {"congress": 118, "chamber": "Senate"},
        }
    }
    assert normalize_terms(member)[0]["chamber"] == "Senate"


def test_normalize_terms_single_dict_item():
    member = {"terms": {"item": [{"congress": 117}]}}
    assert normalize_terms(member)[0]["congress"] == 117


def test_normalize_vote_results_variants():
    assert normalize_vote_results({"results": {"item": {"bioguideId": "X000001"}}}) == [
        {"bioguideId": "X000001"}
    ]
    assert normalize_vote_results({"memberVotes": [{"bioguideId": "Y000002"}]}) == [
        {"bioguideId": "Y000002"}
    ]
    assert normalize_vote_results({}) == []


def test_member_bioguide_id():
    assert member_bioguide_id({"bioguideId": "A000001"}) == "A000001"
    assert member_bioguide_id({"bioguideID": "B000002"}) == "B000002"
    assert member_bioguide_id({}) is None


def test_served_in_house_for_congress():
    member = {
        "terms": [
            {"congress": 118, "chamber": "Senate"},
            {"congress": 119, "chamber": "House of Representatives"},
        ]
    }
    assert served_in_house_for_congress(member, 119)
    assert not served_in_house_for_congress(member, 117)