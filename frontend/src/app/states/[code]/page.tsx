import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompactMemberCard } from "@/components/CompactMemberCard";
import { ShareLinks } from "@/components/ShareLinks";
import { getMembers, getMetrics } from "@/lib/api";
import { formatConsistencyRate } from "@/lib/state-metrics";
import {
  getStateMapImageUrl,
  getStateNameFromCode,
  isValidStateCode,
} from "@/lib/states";

interface StatePageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { code } = await params;
  const upper = code.toUpperCase();
  const name = getStateNameFromCode(upper);
  if (!name) {
    return { title: "State not found" };
  }
  return {
    title: `${name}: Who Voted How`,
    description: `See how ${name}'s members of Congress voted on tracked child safety bills.`,
    openGraph: {
      title: `${name}: Who Voted How | Operation Child Shield`,
      description: `See how ${name}'s House members voted on tracked child safety bills.`,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function StatePage({ params }: StatePageProps) {
  const { code } = await params;
  const upper = code.toUpperCase();

  if (!isValidStateCode(upper)) {
    notFound();
  }

  const stateName = getStateNameFromCode(upper)!;
  const mapUrl = getStateMapImageUrl(stateName, upper);

  let metricsError: string | null = null;
  let membersError: string | null = null;
  let stateMetric = null as Awaited<
    ReturnType<typeof getMetrics>
  >["byState"][number] | null;
  let members: Awaited<ReturnType<typeof getMembers>>["members"] = [];

  try {
    const metrics = await getMetrics();
    stateMetric =
      metrics.byState.find(
        (s) => s.stateCode.toUpperCase() === upper || s.state === stateName
      ) ?? null;
  } catch (e) {
    metricsError = e instanceof Error ? e.message : "Failed to load state metrics";
  }

  try {
    const directory = await getMembers({ state: stateName, limit: 200 });
    members = directory.members;
  } catch (e) {
    membersError = e instanceof Error ? e.message : "Failed to load members";
  }

  const shareUrl =
    (process.env.NEXT_PUBLIC_SITE_URL ?? "https://operationchildshield.org").replace(
      /\/$/,
      ""
    ) + `/states/${upper.toLowerCase()}`;

  return (
    <div className="page-container py-8">
      <Link href="/metrics" className="text-sm text-muted hover:text-blue">
        ← Back to the map
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-6">
        {mapUrl && (
          <Image
            src={mapUrl}
            alt=""
            width={120}
            height={120}
            className="h-24 w-24 object-contain opacity-90"
            aria-hidden
          />
        )}
        <div className="flex-1 min-w-[16rem]">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-muted">
            State overview
          </p>
          <h1 className="m-0 mt-1 text-3xl font-bold text-blue">
            {stateName}{" "}
            <span className="text-lg font-semibold text-muted">({upper})</span>
          </h1>
          <p className="mt-3 text-muted leading-relaxed max-w-2xl">
            House roll-call totals for tracked child safety bills in {stateName}.
          </p>
        </div>
      </div>

      {metricsError ? (
        <p className="mt-6 text-red">{metricsError}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Kpi
            label="Policy consistency"
            value={
              stateMetric?.policyConsistencyRate != null
                ? `${stateMetric.policyConsistencyRate.toFixed(1)}%`
                : "-"
            }
          />
          <Kpi
            label="Consistent votes"
            value={stateMetric?.policyConsistentVotes ?? 0}
          />
          <Kpi
            label="Not consistent"
            value={stateMetric?.policyNotConsistentVotes ?? 0}
          />
          <Kpi label="Recorded votes" value={stateMetric?.recordedVotes ?? 0} />
          <Kpi
            label="House w/ votes"
            value={stateMetric?.houseMembersWithRecordedVotes ?? 0}
          />
          <Kpi
            label="Members tracked"
            value={stateMetric?.membersTracked ?? members.length}
          />
        </div>
      )}

      {stateMetric && (
        <p className="mt-4 text-sm text-muted">
          {formatConsistencyRate(stateMetric.policyConsistencyRate)}
          {stateMetric.participationRate != null
            ? ` · Participation on scored roll calls: ${stateMetric.participationRate.toFixed(1)}%`
            : null}
        </p>
      )}

      <div className="mt-6">
        <ShareLinks
          title={`${stateName} | Operation Child Shield`}
          text={`Child safety voting records for ${stateName} on Operation Child Shield.`}
          url={shareUrl}
        />
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 text-xl font-bold text-blue">
            Meet {stateName}&apos;s Members
          </h2>
          <Link
            href={`/?state=${encodeURIComponent(stateName)}`}
            className="text-sm font-semibold text-red hover:underline"
          >
            Search All Lawmakers →
          </Link>
        </div>

        {membersError ? (
          <p className="mt-4 text-red">{membersError}</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-muted">No members found for this state.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <li key={m.bioguideId}>
                <CompactMemberCard member={m} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[10px] border border-card-border bg-surface p-4 shadow-sm text-center">
      <p className="m-0 text-2xl font-bold text-blue">{value}</p>
      <p className="m-0 mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
    </div>
  );
}
