"use client";

import type {
  ToolkitsSummary,
  ToolkitPendingItem,
} from "@/lib/services/StorageAuditDetailService";

type Props = {
  summary: ToolkitsSummary;
};

function statusChipConfig(status: string | undefined) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className:
          "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    case "in_progress":
      return {
        label: "In progress",
        className: "bg-blue-50 text-blue-700 border border-blue-200",
      };
    case "pending":
    case "not_started":
    default:
      return {
        label: "Not started",
        className: "bg-gray-50 text-gray-600 border border-gray-200",
      };
  }
}

export default function ToolkitsSummaryCard({ summary }: Props) {
  const { total, completed, inProgress, notStarted, pendingItems } = summary;

  const hasPending = total > 0 && pendingItems.length > 0;
  const enableScroll = pendingItems.length > 5;

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white p-4">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Toolkits</h2>
          {total > 0 && (
            <p className="text-[11px] text-gray-500">
              Checked{" "}
              <span className="font-medium">
                {completed} / {total}
              </span>{" "}
              toolkits
            </p>
          )}
        </div>
      </div>

      {/* No toolkits at all */}
      {total === 0 && (
        <p className="text-xs text-gray-400">
          No toolkits assigned to this storage yet.
        </p>
      )}

      {/* All toolkits completed */}
      {total > 0 && pendingItems.length === 0 && (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <span>All toolkits audited for this storage. All set! ✅</span>
        </div>
      )}

      {/* Pending list (not started / in progress) */}
      {hasPending && (
        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
            <span>Toolkits pending this cycle</span>
            <span>
              {inProgress} in progress · {notStarted} not started
            </span>
          </div>

          {/* List grows to fill space; scroll only when needed & when >5 */}
          <div
            className={`space-y-2 pr-1 ${
              enableScroll ? "overflow-y-auto" : ""
            }`}
          >
            {pendingItems.map((kit) => (
              <ToolkitRow key={kit.id} kit={kit} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolkitRow({ kit }: { kit: ToolkitPendingItem }) {
  const chip = statusChipConfig(kit.auditStatus);

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-xs">
      <div className="space-y-1">
        <div className="font-medium text-gray-800">{kit.name}</div>
        <div className="text-[11px] text-gray-500">
          <span className="font-mono">{kit.qrCode}</span>
        </div>
        <div className="text-[11px] text-gray-500">
          {kit.contentsCount} kit contents
        </div>
      </div>

      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.className}`}
      >
        {chip.label}
      </span>
    </div>
  );
}
