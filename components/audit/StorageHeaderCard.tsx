// components/audit/StorageHeaderCard.tsx
"use client";

import AuditStatusBadge from "./AuditStatusBadge";
import AuditCycleCount from "./AuditCycleCount";
import { formatNextAuditDate } from "@/lib/helpers/auditDates";

type Props = {
  mainStorageName: string;
  storageType: string;
  mainStorageCode: string;
  auditStatus: any;
  cycleNumber: number | null;
  maxCycles: number | null;
  nextAuditDate: string | null;
};

export default function StorageHeaderCard({
  mainStorageName,
  storageType,
  mainStorageCode,
  auditStatus,
  cycleNumber,
  maxCycles,
  nextAuditDate,
}: Props) {
  return (
    <div className="rounded-xl bg-blue-600 text-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">
            {mainStorageName}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
            {storageType || "Storage"} · Code: {mainStorageCode}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="bg-white/10 rounded-full px-3 py-1 text-xs flex items-center gap-2">
            <span className="opacity-80">Audit</span>
            <AuditStatusBadge status={auditStatus} />
          </div>
          <div className="bg-white/10 rounded-full px-3 py-1 text-xs">
            <AuditCycleCount
              cycleNumber={cycleNumber}
              maxCycles={maxCycles}
            />
          </div>
          <div className="bg-white/10 rounded-full px-3 py-1 text-xs">
            Next audit:{" "}
            <span className="font-medium">
              {formatNextAuditDate(nextAuditDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
