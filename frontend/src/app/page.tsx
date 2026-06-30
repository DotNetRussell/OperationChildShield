import { Suspense } from "react";
import { GradeFilter } from "@/components/GradeFilter";
import { MemberFiltersBar } from "@/components/MemberFiltersBar";
import { PoliticianGrid } from "@/components/PoliticianGrid";
import { SearchBar } from "@/components/SearchBar";
import {
  getMembers,
  GRADE_FILTER_PAGE_SIZE,
  LANDING_PAGE_SIZE,
  SEARCH_PAGE_SIZE,
  type MemberFilters,
} from "@/lib/api";

interface HomePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function GridSection({
  filters,
  isSearch,
  gradeFilter,
  hasSearch,
  partyFilter,
  stateFilter,
}: {
  filters: MemberFilters;
  isSearch: boolean;
  gradeFilter?: string;
  hasSearch: boolean;
  partyFilter?: string;
  stateFilter?: string;
}) {
  let members: Awaited<ReturnType<typeof getMembers>>["members"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const data = await getMembers(filters);
    members = data.members;
    total = data.total;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load members";
  }

  const enableInfiniteScroll = !hasSearch && !gradeFilter;

  return (
    <PoliticianGrid
      members={members}
      total={total}
      isSearch={isSearch}
      gradeFilter={gradeFilter}
      partyFilter={partyFilter}
      stateFilter={stateFilter}
      error={error}
      infiniteScroll={enableInfiniteScroll}
      listFilters={
        enableInfiniteScroll
          ? {
              sort: "grade",
              limit: LANDING_PAGE_SIZE,
              offset: 0,
              party: filters.party,
              state: filters.state,
              chamber: filters.chamber,
            }
          : undefined
      }
    />
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const hasSearch = Boolean(params.search?.trim());
  const gradeFilter = params.grade?.trim() || undefined;
  const partyFilter = params.party?.trim() || undefined;
  const stateFilter = params.state?.trim() || undefined;

  let limit = LANDING_PAGE_SIZE;
  if (gradeFilter) limit = GRADE_FILTER_PAGE_SIZE;
  else if (hasSearch) limit = SEARCH_PAGE_SIZE;

  const filters: MemberFilters = {
    search: params.search,
    chamber: params.chamber,
    state: params.state,
    party: params.party,
    grade: gradeFilter,
    // Grade sort is applied client-side so the page renders immediately while the
    // grade index warms up on first backend load.
    sort: gradeFilter ? "grade" : undefined,
    limit,
    offset: 0,
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="h-[72px] max-w-[620px] mx-auto mb-10 bg-surface/50 rounded-xl animate-pulse" />
        }
      >
        <SearchBar />
      </Suspense>

      <Suspense fallback={<div className="h-20 mb-8 bg-surface/50 rounded-xl animate-pulse" />}>
        <MemberFiltersBar />
      </Suspense>

      <Suspense fallback={<div className="h-12 mb-8 bg-surface/50 rounded-xl animate-pulse" />}>
        <GradeFilter />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {Array.from({ length: gradeFilter ? 8 : 6 }).map((_, i) => (
              <div key={i} className="h-[340px] bg-surface rounded-[10px] animate-pulse" />
            ))}
          </div>
        }
      >
        <GridSection
          filters={filters}
          isSearch={hasSearch}
          gradeFilter={gradeFilter}
          hasSearch={hasSearch}
          partyFilter={partyFilter}
          stateFilter={stateFilter}
        />
      </Suspense>
    </div>
  );
}