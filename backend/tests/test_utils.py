from app.utils import (
    extract_member_contact,
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


def test_extract_member_contact_full():
    member = {
        "addressInformation": {
            "officeAddress": "1236 Longworth House Office Building",
            "phoneNumber": "(202) 225-4965",
            "city": "Washington",
            "zipCode": 20515,
        },
        "officialWebsiteUrl": "https://pelosi.house.gov/",
    }
    contact = extract_member_contact(member)
    assert contact is not None
    assert contact.office_address == "1236 Longworth House Office Building"
    assert contact.phone == "(202) 225-4965"
    assert contact.city == "Washington"
    assert contact.zip_code == "20515"
    assert contact.website_url == "https://pelosi.house.gov/"


def test_extract_member_contact_missing_returns_none():
    assert extract_member_contact({}) is None
    assert extract_member_contact({"addressInformation": {}}) is None


def test_extract_member_contact_phone_only():
    member = {"addressInformation": {"phoneNumber": "(202) 224-6542"}}
    contact = extract_member_contact(member)
    assert contact is not None
    assert contact.phone == "(202) 224-6542"
    assert contact.website_url is None


def test_served_in_house_for_congress():
    member = {
        "terms": [
            {"congress": 118, "chamber": "Senate"},
            {"congress": 119, "chamber": "House of Representatives"},
        ]
    }
    assert served_in_house_for_congress(member, 119)
    assert not served_in_house_for_congress(member, 117)


def test_normalize_terms_empty_and_invalid():
    assert normalize_terms({}) == []
    assert normalize_terms({"terms": None}) == []
    assert normalize_terms({"terms": "invalid"}) == []


def test_extract_member_contact_alternate_website_fields():
    member = {"officialUrl": "https://example.house.gov/"}
    contact = extract_member_contact(member)
    assert contact is not None
    assert contact.website_url == "https://example.house.gov/"


def test_extract_member_contact_address_item_list():
    member = {
        "addressInformation": {
            "item": [
                {"officeAddress": "100 Main St", "phoneNumber": "(202) 555-0199"},
            ]
        }
    }
    contact = extract_member_contact(member)
    assert contact is not None
    assert contact.office_address == "100 Main St"
    assert contact.phone == "(202) 555-0199"