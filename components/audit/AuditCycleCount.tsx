"use client";

type Props = {
  cycleNumber: number | null;
  maxCycles: number | null;
};

export default function AuditCycleCount({ cycleNumber, maxCycles }: Props) {
  if (!cycleNumber) {
    return (
      <span className="text-[11px] text-gray-400 italic">No cycle set</span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700">
      Cycle {cycleNumber}
      {maxCycles ? ` / ${maxCycles}` : null}
    </span>
  );
}
