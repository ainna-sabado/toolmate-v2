"use client";

type Props = {
  percent: number;
  showLabel?: boolean;
};

export default function AuditProgressBar({ percent, showLabel = true }: Props) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className="flex flex-col gap-1">
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${safe}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] text-gray-500 text-right">
          {safe}% checked
        </span>
      )}
    </div>
  );
}
