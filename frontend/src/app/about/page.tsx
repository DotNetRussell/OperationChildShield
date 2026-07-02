import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-blue">
        ← Back to search
      </Link>

      <h1 className="text-3xl font-bold text-blue mt-4">Policy Positions &amp; Voting Records</h1>
      <p className="mt-4 text-muted leading-relaxed">
        Operation Child Shield publishes a neutral child safety voting record for
        members of Congress. All vote data is sourced from the public{" "}
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
        <h2 className="text-xl font-bold text-blue">What We Report</h2>
        <ul className="mt-4 space-y-3 text-muted leading-relaxed list-disc pl-5">
          <li>
            How each official voted on tracked child safety legislation, including
            bill title, vote cast, and date when available.
          </li>
          <li>
            Whether each recorded floor vote is consistent or not consistent with
            Operation Child Shield&apos;s board-adopted policy positions.
          </li>
          <li>
            Direct links to the official bill page and roll-call record on
            Congress.gov.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-blue">What We Do Not Publish</h2>
        <ul className="mt-4 space-y-3 text-muted leading-relaxed list-disc pl-5">
          <li>Letter grades, star ratings, or percentage scores for officials.</li>
          <li>Rankings such as &quot;best,&quot; &quot;worst,&quot; or &quot;champion/failure&quot; labels.</li>
          <li>Editorial endorsements or opposition to any candidate or officeholder.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-blue">Bill Selection</h2>
        <p className="mt-4 text-muted leading-relaxed">
          We track legislation on child sexual abuse, exploitation, online safety
          (EARN IT, KOSA), sex offender registration, and victim support. See the{" "}
          <Link href="/bills" className="text-red font-semibold hover:underline">
            tracked bills page
          </Link>{" "}
          for the full list.
        </p>
      </section>

      <section className="mt-10 bg-surface rounded-[10px] p-6 border border-card-border shadow-sm">
        <h2 className="text-xl font-bold text-blue">Our Mission</h2>
        <p className="mt-3 text-muted leading-relaxed">
          Children depend on adults to protect them. Operation Child Shield gives
          the public factual, sourced information about how elected officials vote
          when children&apos;s safety is on the line — without grading or ranking them.
        </p>
      </section>

      <p className="mt-10 text-sm text-muted">
        See our full{" "}
        <Link href="/disclaimer" className="text-blue font-medium hover:underline">
          legal disclaimer
        </Link>{" "}
        for data sourcing and contact information.
      </p>
    </div>
  );
}