import type { MetricsDashboardData } from "./metrics-types";
import type { MemberSummary, ReportCard, TrackedBill } from "./types";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

async function fetchApi<T>(path: string, timeoutMs = 20_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 86400 },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body}`);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out while waiting for congressional data");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export interface MemberFilters {
  search?: string;
  chamber?: string;
  state?: string;
  party?: string;
  grade?: string;
  sort?: "grade";
  limit?: number;
  offset?: number;
}

export const LANDING_PAGE_SIZE = 15;
export const SEARCH_PAGE_SIZE = 50;
export const GRADE_FILTER_PAGE_SIZE = 250;
export const DEFAULT_GRADE_FILTER = "F";
export const GRADE_FILTER_ALL = "all";

/** Maps URL grade param to API filter; defaults to F, treats "all" as no filter. */
export function resolveGradeFilter(grade?: string): string | undefined {
  const raw = grade?.trim();
  if (raw === GRADE_FILTER_ALL) return undefined;
  if (!raw) return DEFAULT_GRADE_FILTER;
  return raw;
}

function buildMembersQuery(filters: MemberFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.chamber) params.set("chamber", filters.chamber);
  if (filters.state) params.set("state", filters.state);
  if (filters.party) params.set("party", filters.party);
  if (filters.grade) params.set("grade", filters.grade);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit != null) params.set("limit", String(filters.limit));
  if (filters.offset != null) params.set("offset", String(filters.offset));
  return params.toString();
}

export type MembersResponse = {
  members: MemberSummary[];
  total: number;
  limit: number | null;
  offset: number;
  grade: string | null;
  congress: number;
};

export async function getMembers(
  filters: MemberFilters = {}
): Promise<MembersResponse> {
  const qs = buildMembersQuery(filters);
  return fetchApi(`/api/members${qs ? `?${qs}` : ""}`);
}

/** Client-side member fetch for infinite scroll (no Next.js cache). */
export async function fetchMembersClient(
  filters: MemberFilters = {}
): Promise<MembersResponse> {
  const qs = buildMembersQuery(filters);
  const res = await fetch(`${API_URL}/api/members${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function getReportCard(bioguideId: string): Promise<ReportCard> {
  return fetchApi(`/api/members/${bioguideId}/report-card`);
}

export async function getTrackedBills(): Promise<{
  bills: TrackedBill[];
  congress: number;
}> {
  return fetchApi("/api/bills");
}

export async function getHealth(): Promise<{
  status: string;
  api_key_configured: boolean;
}> {
  return fetchApi("/api/health");
}

export async function getMetrics(): Promise<MetricsDashboardData> {
  return fetchApi("/api/metrics");
}

export function getMetricsExportUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl) return `${publicUrl}/api/metrics/export`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/metrics/export`;
  }
  return "/api/metrics/export";
}