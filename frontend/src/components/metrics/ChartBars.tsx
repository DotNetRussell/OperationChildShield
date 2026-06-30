"use client";

interface BarItem {
  label: string;
  value: number;
  displayValue?: string;
  colorClass?: string;
}

interface ChartBarsProps {
  items: BarItem[];
  horizontal?: boolean;
  maxValue?: number;
  showValues?: boolean;
  className?: string;
}

export function ChartBars({
  items,
  horizontal = true,
  maxValue,
  showValues = true,
  className = "",
}: ChartBarsProps) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);

  if (horizontal) {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-foreground">{item.label}</span>
              {showValues && (
                <span className="text-muted tabular-nums">
                  {item.displayValue ?? item.value}
                </span>
              )}
            </div>
            <div className="h-3 bg-surface-subtle rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.colorClass || "bg-blue"}`}
                style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 h-48 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          {showValues && (
            <span className="text-xs text-muted tabular-nums">
              {item.displayValue ?? item.value}
            </span>
          )}
          <div className="w-full flex items-end justify-center h-36">
            <div
              className={`w-full max-w-[2.5rem] rounded-t-md transition-all duration-500 ${item.colorClass || "bg-blue"}`}
              style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 0)}%` }}
              title={`${item.label}: ${item.displayValue ?? item.value}`}
            />
          </div>
          <span className="text-[10px] sm:text-xs text-muted text-center leading-tight truncate w-full">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}