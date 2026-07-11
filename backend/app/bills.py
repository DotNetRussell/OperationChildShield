"""Curated child protection legislation tracked by Operation Child Shield."""

from dataclasses import dataclass
from enum import Enum


class BillCategory(str, Enum):
    CHILD_SEXUAL_ABUSE = "Child Sexual Abuse"
    EXPLOITATION = "Exploitation & Trafficking"
    ONLINE_SAFETY = "Online Safety"
    SEX_OFFENDER = "Sex Offender Registration"
    VICTIM_SUPPORT = "Victim Support & Justice"


class ProtectionStance(str, Enum):
    """Whether voting Yea is pro-child-protection for this bill."""
    PROTECTION = "protection"
    ANTI_PROTECTION = "anti_protection"


class BillFloorStatus(str, Enum):
    """How far the bill advanced and whether House roll-call data exists."""

    HOUSE_ROLL_CALL = "house_roll_call"
    PASSED_HOUSE = "passed_house"
    PASSED_SENATE = "passed_senate"
    PASSED_BOTH = "passed_both"
    INTRODUCED = "introduced"


FLOOR_STATUS_LABELS: dict[BillFloorStatus, str] = {
    BillFloorStatus.HOUSE_ROLL_CALL: "House roll call vote (scored)",
    BillFloorStatus.PASSED_HOUSE: "Passed House (voice vote, not individually scored)",
    BillFloorStatus.PASSED_SENATE: "Passed Senate (not individually scored for House members)",
    BillFloorStatus.PASSED_BOTH: "Passed both chambers (voice votes, not individually scored)",
    BillFloorStatus.INTRODUCED: "Introduced (awaiting floor vote)",
}


_BILL_TYPE_SLUGS = {
    "HR": "house-bill",
    "S": "senate-bill",
    "HJRES": "house-joint-resolution",
    "SJRES": "senate-joint-resolution",
    "HCONRES": "house-concurrent-resolution",
    "SCONRES": "senate-concurrent-resolution",
    "HRES": "house-resolution",
    "SRES": "senate-resolution",
}


def build_congress_bill_url(congress: int, bill_type: str, number: int) -> str:
    slug = _BILL_TYPE_SLUGS.get(bill_type.upper(), "house-bill")
    return f"https://www.congress.gov/bill/{congress}/{slug}/{number}"


@dataclass(frozen=True)
class TrackedBill:
    congress: int
    bill_type: str
    number: int
    title: str
    category: BillCategory
    stance: ProtectionStance
    description: str

    @property
    def bill_id(self) -> str:
        return f"{self.congress}-{self.bill_type.lower()}-{self.number}"

    @property
    def display_number(self) -> str:
        return f"{self.bill_type} {self.number}"

    @property
    def congress_url(self) -> str:
        return build_congress_bill_url(self.congress, self.bill_type, self.number)

    @property
    def floor_status(self) -> BillFloorStatus:
        return BILL_FLOOR_STATUS.get(self.bill_id, BillFloorStatus.INTRODUCED)

    @property
    def floor_status_label(self) -> str:
        return FLOOR_STATUS_LABELS[self.floor_status]

    @property
    def is_house_scorable(self) -> bool:
        return (
            self.bill_type in HOUSE_BILL_TYPES
            and self.floor_status == BillFloorStatus.HOUSE_ROLL_CALL
        )


TRACKED_BILLS: list[TrackedBill] = [
    # 119th Congress (2025-2027) - verified at congress.gov
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=6484,
        title="Kids Online Safety Act",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="Establishes duty of care for platforms to protect minors from online harms.",
    ),
    TrackedBill(
        congress=119,
        bill_type="S",
        number=1748,
        title="Kids Online Safety Act",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="Senate companion establishing platform duty of care for minors online.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=1283,
        title="Protecting Our Children in an AI World Act of 2025",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="Requires platforms to protect minors from harmful AI-generated content.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=2735,
        title="Strengthening Child Exploitation Enforcement Act",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Enhances federal enforcement against child exploitation crimes.",
    ),
    TrackedBill(
        congress=119,
        bill_type="S",
        number=1333,
        title="Strengthening Child Exploitation Enforcement Act",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Senate companion closing loopholes in federal child exploitation laws.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=134,
        title="Protecting our Communities from Sexual Predators Act",
        category=BillCategory.CHILD_SEXUAL_ABUSE,
        stance=ProtectionStance.PROTECTION,
        description="Strengthens penalties and enforcement against sexual predators.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=394,
        title="Holding Child Predators Accountable Act",
        category=BillCategory.CHILD_SEXUAL_ABUSE,
        stance=ProtectionStance.PROTECTION,
        description="Increases accountability for offenders who prey on children.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=3537,
        title="Targeting Child Predators Act of 2025",
        category=BillCategory.SEX_OFFENDER,
        stance=ProtectionStance.PROTECTION,
        description="Targets predators who exploit children and strengthens law enforcement tools.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=4929,
        title="Enduring Justice for Victims of Trafficking Act",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Supports victims of human trafficking and strengthens prosecution tools.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=5348,
        title="Social Security Child Protection Act of 2025",
        category=BillCategory.CHILD_SEXUAL_ABUSE,
        stance=ProtectionStance.PROTECTION,
        description="Protects children in Social Security disability benefit determinations.",
    ),
    # 118th Congress (2023-2025) - verified at congress.gov
    TrackedBill(
        congress=118,
        bill_type="HR",
        number=2732,
        title="EARN IT Act of 2023",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="118th Congress EARN IT Act for platform accountability.",
    ),
    TrackedBill(
        congress=118,
        bill_type="S",
        number=1207,
        title="EARN IT Act of 2023",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="Senate companion to the 118th Congress EARN IT Act.",
    ),
    TrackedBill(
        congress=118,
        bill_type="HR",
        number=7891,
        title="Kids Online Safety Act",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="118th Congress version of KOSA protecting minors online.",
    ),
    TrackedBill(
        congress=118,
        bill_type="S",
        number=1409,
        title="Kids Online Safety Act",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="Senate companion to the 118th Congress KOSA.",
    ),
    TrackedBill(
        congress=118,
        bill_type="HR",
        number=8005,
        title="Child Exploitation and Artificial Intelligence Expert Commission Act of 2024",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Addresses AI-generated child exploitation material through expert review.",
    ),
    TrackedBill(
        congress=118,
        bill_type="HR",
        number=5856,
        title="Frederick Douglass Trafficking Victims Prevention and Protection Reauthorization Act of 2023",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Reauthorizes federal anti-trafficking programs and victim support services.",
    ),
    TrackedBill(
        congress=118,
        bill_type="HR",
        number=443,
        title="Enhancing Detection of Human Trafficking Act",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Improves detection and reporting of human trafficking cases.",
    ),
    TrackedBill(
        congress=118,
        bill_type="HR",
        number=663,
        title="Native American Child Protection Act",
        category=BillCategory.CHILD_SEXUAL_ABUSE,
        stance=ProtectionStance.PROTECTION,
        description="Strengthens child protection services in Native American communities.",
    ),
    # 117th Congress (2021-2023) - verified at congress.gov
    TrackedBill(
        congress=117,
        bill_type="HR",
        number=6544,
        title="EARN IT Act of 2022",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="117th Congress EARN IT Act holding platforms accountable for child exploitation.",
    ),
    TrackedBill(
        congress=117,
        bill_type="S",
        number=3538,
        title="EARN IT Act of 2022",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="Senate companion to the 117th Congress EARN IT Act.",
    ),
    TrackedBill(
        congress=117,
        bill_type="HR",
        number=6552,
        title="Frederick Douglass Trafficking Victims Prevention and Protection Reauthorization Act of 2022",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Reauthorizes federal anti-trafficking programs and victim support services.",
    ),
    # Floor-action bills (voice vote / Senate passage - tracked, not roll-call scored)
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=6715,
        title="Child Predators Accountability Act",
        category=BillCategory.CHILD_SEXUAL_ABUSE,
        stance=ProtectionStance.PROTECTION,
        description="Increases accountability for offenders who prey on children.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=6475,
        title="Preventing Child Trafficking Act of 2025",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="House companion to strengthen prevention of child trafficking.",
    ),
    TrackedBill(
        congress=119,
        bill_type="S",
        number=1049,
        title="Preventing Child Trafficking Act of 2025",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Passed the Senate unanimously; awaits House action.",
    ),
    TrackedBill(
        congress=118,
        bill_type="S",
        number=4708,
        title="Strengthening Child Exploitation Enforcement Act",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="118th Congress version; passed the Senate unanimously in Nov. 2024.",
    ),
    TrackedBill(
        congress=118,
        bill_type="S",
        number=3687,
        title="Preventing Child Trafficking Act of 2024",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Passed the Senate unanimously in April 2024.",
    ),
    TrackedBill(
        congress=118,
        bill_type="S",
        number=2073,
        title="Kids Online Safety and Privacy Act",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="Combined KOSA/COPPA update; passed the Senate and House by voice vote in 2024.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=7757,
        title="KIDS Act",
        category=BillCategory.ONLINE_SAFETY,
        stance=ProtectionStance.PROTECTION,
        description="Kids Internet and Digital Safety Act with KOSA-style online safety provisions.",
    ),
    # Additional House roll-call bills (verified on Congress.gov)
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=3492,
        title="Protect Children\u2019s Innocence Act",
        category=BillCategory.CHILD_SEXUAL_ABUSE,
        stance=ProtectionStance.PROTECTION,
        description="Protects children from certain medical procedures; passed the House by roll call.",
    ),
    TrackedBill(
        congress=119,
        bill_type="HR",
        number=7726,
        title="Stop Child Care Scams Act of 2026",
        category=BillCategory.EXPLOITATION,
        stance=ProtectionStance.PROTECTION,
        description="Cracks down on fraud schemes targeting child care assistance programs.",
    ),
]

BILL_FLOOR_STATUS: dict[str, BillFloorStatus] = {
    # House roll call - these drive Protection Scores
    "117-hr-6552": BillFloorStatus.HOUSE_ROLL_CALL,
    "118-hr-443": BillFloorStatus.HOUSE_ROLL_CALL,
    "118-hr-663": BillFloorStatus.HOUSE_ROLL_CALL,
    "118-hr-5856": BillFloorStatus.HOUSE_ROLL_CALL,
    "119-hr-5348": BillFloorStatus.HOUSE_ROLL_CALL,
    "119-hr-3492": BillFloorStatus.HOUSE_ROLL_CALL,
    "119-hr-7726": BillFloorStatus.HOUSE_ROLL_CALL,
    # Senate passage
    "119-s-1333": BillFloorStatus.PASSED_SENATE,
    "119-s-1049": BillFloorStatus.PASSED_SENATE,
    "118-s-4708": BillFloorStatus.PASSED_SENATE,
    "118-s-3687": BillFloorStatus.PASSED_SENATE,
    # Both chambers (voice votes)
    "118-s-2073": BillFloorStatus.PASSED_BOTH,
    # House passage (voice vote)
    "119-hr-6715": BillFloorStatus.PASSED_HOUSE,
}

CHILD_PROTECTION_KEYWORDS = [
    "child",
    "children",
    "minor",
    "minors",
    "juvenile",
    "pedophil",
    "predator",
    "exploitation",
    "trafficking",
    "sex offender",
    "sexual abuse",
    "csam",
    "online safety",
    "earn it",
    "kosa",
]


HOUSE_BILL_TYPES = frozenset({"HR", "HJRES", "HCONRES", "HRES"})


def get_tracked_bills(congress: int | None = None) -> list[TrackedBill]:
    if congress is None:
        return TRACKED_BILLS
    return [b for b in TRACKED_BILLS if b.congress == congress]


def get_scoring_bills(congresses: tuple[int, ...] = (117, 118, 119)) -> list[TrackedBill]:
    """House bills with verified roll-call votes used for Protection Scores."""
    return [
        b
        for b in TRACKED_BILLS
        if b.congress in congresses and b.is_house_scorable
    ]


def get_report_bills(congresses: tuple[int, ...] = (117, 118, 119)) -> list[TrackedBill]:
    """All tracked bills shown on member report cards."""
    return [b for b in TRACKED_BILLS if b.congress in congresses]


def get_bill_by_id(bill_id: str) -> TrackedBill | None:
    for bill in TRACKED_BILLS:
        if bill.bill_id == bill_id:
            return bill
    return None


def matches_child_protection_keywords(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in CHILD_PROTECTION_KEYWORDS)