from typing import Any


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


def served_in_house_for_congress(member: dict[str, Any], congress: int) -> bool:
    """True if the member held a House seat during the given Congress."""
    for term in normalize_terms(member):
        chamber = term.get("chamber", "")
        if "House" not in chamber:
            continue
        if term.get("congress") == congress:
            return True
    return False