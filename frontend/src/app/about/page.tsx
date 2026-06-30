import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-blue">
        ← Back to search
      </Link>

      <h1 className="text-3xl font-bold text-blue mt-4">Scoring Methodology</h1>
      <p className="mt-4 text-muted leading-relaxed">
        Child Shield assigns each member of Congress a protection score based on
        their recorded votes on curated child protection legislation. All data is
        sourced from the public{" "}
        <a
          href="https://api.congress.gov/"
          className="text-red font-semibold hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Congress.gov API
        </a>
        .
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-blue">How Scores Are Calculated</h2>
        <ul className="mt-4 space-y-3 text-muted leading-relaxed list-disc pl-5">
          <li>
            Each tracked bill is classified as a pro-protection measure. Voting
            &quot;Aye&quot; earns full credit; voting &quot;Nay&quot; earns zero.
          </li>
          <li>
            &quot;Present&quot; and &quot;Not Voting&quot; receive zero credit and
            count against the score the same as a vote against child protection.
          </li>
          <li>
            Letter grades: A (90%+), B (80–89%), C (70–79%), D (60–69%), F
            (below 60%).
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-blue">Bill Selection</h2>
        <p className="mt-4 text-muted leading-relaxed">
          We track legislation on child sexual abuse, exploitation, online safety
          (EARN IT, KOSA), sex offender registration, and victim support.
        </p>
      </section>

      <section className="mt-10 bg-surface rounded-[10px] p-6 border border-card-border shadow-sm">
        <h2 className="text-xl font-bold text-blue">Our Mission</h2>
        <p className="mt-3 text-muted leading-relaxed">
          Children depend on adults to protect them. Child Shield gives voters
          clear, sourced information about how elected officials vote when
          children&apos;s safety is on the line.
        </p>
      </section>

      <p className="mt-10 text-sm text-muted">
        This site is provided for entertainment purposes. See our full{" "}
        <Link href="/disclaimer" className="text-blue font-medium hover:underline">
          legal disclaimer
        </Link>{" "}
        for data sourcing and contact information.
      </p>
    </div>
  );
}