"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { DEFAULT_GRADE_FILTER, GRADE_FILTER_ALL } from "@/lib/api";
import { gradeCircleClass } from "@/lib/format";

const GRADE_OPTIONS = [
  { value: GRADE_FILTER_ALL, label: "All" },
  { value: "F", label: "F" },
  { value: "D", label: "D" },
  { value: "C", label: "C" },
  { value: "B", label: "B" },
  { value: "A", label: "A" },
  { value: "N/A", label: "N/A" },
] as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function GradeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeGrade = searchParams.get("grade") ?? DEFAULT_GRADE_FILTER;
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`${API_URL}/api/grades/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.counts) setCounts(data.counts);
      })
      .catch(() => {});
  }, []);

  function selectGrade(grade: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("grade", grade);

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div className="mb-8">
      <p className="text-center text-sm font-semibold text-muted uppercase tracking-wider mb-3">
        Filter by Protection Grade
      </p>
      <div className="flex flex-wrap justify-center gap-2 px-1 sm:gap-3">
        {GRADE_OPTIONS.map(({ value, label }) => {
          const isActive = activeGrade === value;
          const count = value !== GRADE_FILTER_ALL ? counts[value] : undefined;
          const isLetter = value !== GRADE_FILTER_ALL && value !== "N/A";

          return (
            <button
              key={value || "all"}
              type="button"
              onClick={() => selectGrade(value)}
              disabled={isPending}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm
                border-2 transition-all cursor-pointer disabled:opacity-60
                ${
                  isActive
                    ? "border-blue bg-blue text-white shadow-md scale-105"
                    : "border-card-border bg-surface text-foreground hover:border-blue hover:shadow-sm"
                }
              `}
            >
              {isLetter ? (
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white border-2 border-white/80 ${gradeCircleClass(value)}`}
                >
                  {label}
                </span>
              ) : (
                <span className="font-bold">{label}</span>
              )}
              {count !== undefined && (
                <span
                  className={`text-xs ${isActive ? "text-blue-100" : "text-muted"}`}
                >
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
      {activeGrade !== GRADE_FILTER_ALL && (
        <p className="text-center text-xs text-muted mt-3">
          First grade filter may take a minute while scores are calculated. Results are
          cached afterward.
        </p>
      )}
    </div>
  );
}