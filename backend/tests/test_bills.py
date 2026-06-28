from app.bills import (
    BillFloorStatus,
    TRACKED_BILLS,
    build_congress_bill_url,
    get_bill_by_id,
    get_report_bills,
    get_scoring_bills,
    get_tracked_bills,
)


def test_tracked_bill_count():
    assert len(TRACKED_BILLS) == 30


def test_scoring_bill_count():
    scoring = get_scoring_bills()
    assert len(scoring) == 7
    assert all(b.is_house_scorable for b in scoring)
    assert all(b.floor_status == BillFloorStatus.HOUSE_ROLL_CALL for b in scoring)


def test_get_tracked_bills_filters_congress():
    bills_119 = get_tracked_bills(119)
    assert bills_119
    assert all(b.congress == 119 for b in bills_119)


def test_get_report_bills_includes_multiple_congresses():
    report_bills = get_report_bills()
    congresses = {b.congress for b in report_bills}
    assert 117 in congresses
    assert 118 in congresses
    assert 119 in congresses


def test_build_congress_bill_url():
    url = build_congress_bill_url(119, "HR", 6484)
    assert url == "https://www.congress.gov/bill/119/house-bill/6484"


def test_get_bill_by_id():
    bill = get_bill_by_id("119-hr-6484")
    assert bill is not None
    assert bill.title == "Kids Online Safety Act"
    assert get_bill_by_id("missing-bill") is None