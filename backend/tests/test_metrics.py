from app.metrics import is_passing_score, normalize_party, seniority_bucket


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