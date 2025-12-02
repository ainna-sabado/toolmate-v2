// components/audit/StatCard.tsx
"use client";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export default function StatCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-xl border bg-white p-3 sm:p-4 flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="text-lg font-semibold">{value}</span>
      {hint && (
        <span className="text-[11px] text-gray-400 leading-tight">
          {hint}
        </span>
      )}
    </div>
  );
}
