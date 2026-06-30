from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.scoring import MemberContact


def normalize_terms(member: dict[str, Any]) -> list[dict[str, Any]]:
    terms = member.get("terms", {})
    if isinstance(terms, list):
        items = terms
    elif isinstance(terms, dict):
        items = terms.get("item", [])
    else:
        items = []

    if isinstance(items, dict):
        return [items]
    if isinstance(items, list):
        return items
    return []


def normalize_vote_results(vote_data: dict[str, Any]) -> list[dict[str, Any]]:
    results = vote_data.get("results", vote_data.get("memberVotes", []))
    if isinstance(results, dict):
        items = results.get("item", results)
        if isinstance(items, dict):
            return [items]
        if isinstance(items, list):
            return items
        return []
    if isinstance(results, list):
        return results
    return []


def member_bioguide_id(item: dict[str, Any]) -> str | None:
    return item.get("bioguideId") or item.get("bioguideID")


def _normalize_address_block(address: Any) -> dict[str, Any]:
    if isinstance(address, dict):
        items = address.get("item", address)
        if isinstance(items, dict):
            return items
        if isinstance(items, list) and items:
            return items[0] if isinstance(items[0], dict) else {}
    return {}


def extract_member_contact(member: dict[str, Any]) -> "MemberContact | None":
    """Pull office contact details from a Congress.gov member record."""
    from app.scoring import MemberContact

    addr = _normalize_address_block(member.get("addressInformation"))
    office = (addr.get("officeAddress") or "").strip() or None
    phone = (addr.get("phoneNumber") or "").strip() or None
    city = (addr.get("city") or "").strip() or None
    zip_code = addr.get("zipCode")
    zip_str = str(zip_code).strip() if zip_code not in (None, "") else None

    website = (
        member.get("officialWebsiteUrl")
        or member.get("officialUrl")
        or member.get("officialWebsite")
        or ""
    )
    website = str(website).strip() or None

    if not any([office, phone, website]):
        return None

    return MemberContact(
        office_address=office,
        phone=phone,
        city=city,
        zip_code=zip_str,
        website_url=website,
    )


def served_in_house_for_congress(member: dict[str, Any], congress: int) -> bool:
    """True if the member held a House seat during the given Congress."""
    for term in normalize_terms(member):
        chamber = term.get("chamber", "")
        if "House" not in chamber:
            continue
        if term.get("congress") == congress:
            return True
    return False