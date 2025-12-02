// components/audit/ToolStatusDonutChart.tsx
"use client";

import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";
import type { StatusCounts } from "@/lib/services/StorageAuditDetailService";

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  "in use": "In use",
  "for calibration": "For cal",
  damaged: "Damaged",
  lost: "Lost",
  maintenance: "Maintenance",
  expired: "Expired",
};

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#e11d48",
  "#6b7280",
  "#0d9488",
  "#a855f7",
];

type Props = {
  statusCounts: StatusCounts;
};

export default function ToolStatusDonutChart({ statusCounts }: Props) {
  const entries = Object.entries(statusCounts || {});
  const data = entries
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({
      name: STATUS_LABELS[k] || k,
      value: v,
    }));

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-gray-400">
        No tools or toolkits yet for this storage.
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-center">
      {/* Donut chart */}
      <div className="flex-1 min-w-[140px] h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="80%"
              strokeWidth={1}
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 text-[11px] text-gray-600 min-w-[120px]">
        {data.map((entry, idx) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="truncate">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
