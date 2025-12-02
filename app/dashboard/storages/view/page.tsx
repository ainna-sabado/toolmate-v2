// app/dashboard/storages/view/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDepartment } from "@/context/DepartmentContext";
import { useStorageDetailDashboard } from "@/hooks/useStorageDetailDashboard";

import StorageHeaderCard from "@/components/audit/StorageHeaderCard";
import StatCard from "@/components/audit/StatCard";
import ToolStatusDonutChart from "@/components/audit/ToolStatusDonutChart";
import ToolkitsSummaryCard from "@/components/audit/ToolkitsSummaryCard";
import QrLocationsProgress from "@/components/audit/QrLocationsProgress";
import EQ5044ReportCard from "@/components/audit/EQ5044ReportCard";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 👇 All your existing logic moved into an inner component
function StorageDetailContent() {
  const searchParams = useSearchParams();
  const { mainDepartment } = useDepartment();

  const mainStorageName = searchParams.get("mainStorageName");
  const mainStorageCode = searchParams.get("mainStorageCode");

  const { data, loading, error } = useStorageDetailDashboard({
    mainDepartment,
    mainStorageName,
    mainStorageCode,
  });

  if (!mainStorageName || !mainStorageCode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">
          Missing mainStorageName or mainStorageCode in the URL.
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Loading storage dashboard…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          No data found for this storage yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header blue card */}
      <StorageHeaderCard
        mainStorageName={data.mainStorageName}
        storageType={data.storageType}
        mainStorageCode={data.mainStorageCode}
        auditStatus={data.auditStatus}
        cycleNumber={data.cycleNumber}
        maxCycles={data.maxCycles}
        nextAuditDate={data.nextAuditDate}
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total tools"
          value={data.totalTools}
          hint={`${data.individualToolsTotal} tools · ${data.toolkitsTotal} kits`}
        />
        <StatCard
          label="Tools audited this cycle"
          value={data.toolsAudited}
          hint="Tools + completed kits"
        />
        <StatCard label="Remaining tools" value={data.remainingTools} />
        <StatCard label="Completion" value={`${data.completionPercent}%`} />
      </div>

      {/* Toolkits + donut + CTA */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left column: toolkits summary (stretches with row height) */}
        <ToolkitsSummaryCard summary={data.toolkitsSummary} />

        {/* Right column: donut chart + blue CTA stacked */}
        <div className="space-y-4">
          {/* Donut chart */}
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-2 text-sm font-semibold">
                Tool & toolkit status distribution
              </h2>
              <ToolStatusDonutChart statusCounts={data.statusCounts} />
            </CardContent>
          </Card>

          {/* Ready to audit CTA */}
          <Card className="border-blue-500 bg-blue-600 text-white shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-white/20 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h6v6H3V3zm12 0h6v6h-6V3zM3 15h6v6H3v-6zm12 0h3m-3 3h3m0 0h3m-6-6h6v6h-6v-6z"
                    />
                  </svg>
                </div>

                <div className="flex-1">
                  <h2 className="text-sm font-semibold">
                    Ready to audit this storage?
                  </h2>
                  <p className="mt-0.5 text-xs leading-snug text-blue-100">
                    Stand at this main storage, scan the QR, and begin marking
                    tools as present, missing, or needing update.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                className="w-fit bg-white text-blue-700 hover:bg-blue-100 text-xs"
                type="button"
              >
                Scan QR to start audit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR locations + EQ5044 report */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QrLocationsProgress locations={data.qrLocations} />
        <EQ5044ReportCard
          mainStorageName={data.mainStorageName}
          mainStorageCode={data.mainStorageCode}
        />
      </div>
    </div>
  );
}

// 👇 Default export now just wraps content in Suspense
export default function StorageDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Loading storage dashboard…</p>
        </div>
      }
    >
      <StorageDetailContent />
    </Suspense>
  );
}
