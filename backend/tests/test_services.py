from app.services import grade_bucket, grade_sort_key, matches_grade_filter, summarize_grade_index


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