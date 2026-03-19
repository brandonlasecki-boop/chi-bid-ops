'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className = '',
  showLabel = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 tabular-nums w-10">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
