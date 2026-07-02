interface StackedBarSegment {
  label: string;
  value: number;
  color: string;
}

export interface StackedBarRow {
  id: string;
  label: string;
  sublabel?: string;
  segments: StackedBarSegment[];
}

interface StackedBarChartProps {
  rows: StackedBarRow[];
  className?: string;
}

export function StackedBarChart({ rows, className = "" }: StackedBarChartProps) {
  const maxTotal = Math.max(
    ...rows.map((row) => row.segments.reduce((sum, segment) => sum + segment.value, 0)),
    1
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {rows.map((row) => {
        const total = row.segments.reduce((sum, segment) => sum + segment.value, 0);
        return (
          <div key={row.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="m-0 font-semibold text-foreground truncate">{row.label}</p>
                {row.sublabel && (
                  <p className="m-0 mt-0.5 text-xs text-muted truncate">{row.sublabel}</p>
                )}
              </div>
              <p className="m-0 text-xs text-muted shrink-0">{total} votes recorded</p>
            </div>
            <div
              className="mt-2 flex h-5 w-full overflow-hidden rounded-full bg-surface-muted"
              role="img"
              aria-label={`${row.label}: ${row.segments
                .map((segment) => `${segment.label} ${segment.value}`)
                .join(", ")}`}
            >
              {row.segments.map((segment) =>
                segment.value > 0 ? (
                  <div
                    key={segment.label}
                    className="h-full"
                    style={{
                      width: `${(segment.value / maxTotal) * 100}%`,
                      backgroundColor: segment.color,
                    }}
                    title={`${segment.label}: ${segment.value}`}
                  />
                ) : null
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted">
              {row.segments.map((segment) => (
                <span key={segment.label}>
                  {segment.label}: {segment.value}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}