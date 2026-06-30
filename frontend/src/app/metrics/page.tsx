import type { Metadata } from "next";
import { MetricsDashboard } from "@/components/metrics/MetricsDashboard";
import { getMetrics } from "@/lib/api";

export const metadata: Metadata = {
  title: "Metrics Dashboard",
  description:
    "Congress-wide analytics on child protection voting: score distributions, party and state breakdowns, participation rates, and bill-level insights.",
};

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  let data = null;
  let error: string | null = null;

  try {
    data = await getMetrics();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load metrics";
  }

  if (error || !data) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="bg-surface rounded-xl border border-red-200 p-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Metrics Dashboard</h1>
          <p className="mt-3 text-red">{error ?? "Unable to load dashboard data."}</p>
          <p className="mt-2 text-sm text-muted">
            The metrics API aggregates report cards for all members and may take a minute on
            first load.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <MetricsDashboard data={data} />
    </div>
  );
}