// components/audit/QrLocationsProgress.tsx
"use client";

import type { QrLocationProgress } from "@/lib/services/StorageAuditDetailService";

type Props = {
  locations: QrLocationProgress[];
};

export default function QrLocationsProgress({ locations }: Props) {
  if (!locations.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-xs text-gray-400">
        No QR locations found for this storage yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <h2 className="text-sm font-semibold">QR locations audit progress</h2>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {locations.map((loc) => (
          <div
            key={loc.qrLocation}
            className="flex flex-col gap-1 text-xs"
          >
            <div className="flex justify-between">
              <span className="font-medium">
                {loc.qrLocation === "UNASSIGNED"
                  ? "Unassigned"
                  : loc.qrLocation}
              </span>
              <span className="text-gray-500">
                {loc.auditedUnits}/{loc.totalUnits} checked
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${loc.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
