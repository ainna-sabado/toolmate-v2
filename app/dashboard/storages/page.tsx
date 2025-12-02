"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDepartment } from "@/context/DepartmentContext";
import { useStorageDashboard } from "@/hooks/useStorageDashboard";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import AuditStatusBadge from "@/components/audit/AuditStatusBadge";
import AuditProgressBar from "@/components/audit/AuditProgressBar";
import AuditCycleCount from "@/components/audit/AuditCycleCount";
import { formatNextAuditDate } from "@/lib/helpers/auditDates";

import { LayoutTemplate, RefreshCw } from "lucide-react";

function unitLabel(storageType: string): string {
  if (!storageType) return "locations";
  const lower = storageType.toLowerCase();
  if (lower.includes("roll")) return "drawers";
  if (lower.includes("shelf")) return "rows";
  if (lower.includes("bin")) return "bins";
  if (lower.includes("cart")) return "positions";
  return "locations";
}

export default function StorageDashboardsPage() {
  const { mainDepartment } = useDepartment();
  const { rows, loading, error, refresh } = useStorageDashboard(mainDepartment);

  const hasData = rows && rows.length > 0;

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.toolsTotal += row.toolsTotal;
          acc.toolsChecked += row.toolsChecked;
          acc.storageCount += 1;
          return acc;
        },
        {
          toolsTotal: 0,
          toolsChecked: 0,
          storageCount: 0,
        }
      ),
    [rows]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-semibold">Main Storage Dashboards</h1>
            <p className="text-xs text-gray-500">
              Department: {mainDepartment || "— Select from header"}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={refresh}
          disabled={loading}
          className="gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !hasData && !error && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-gray-500">
            No storages found for this department yet.
          </CardContent>
        </Card>
      )}

      {/* Summary strip */}
      {hasData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-dashed">
              <CardContent className="py-3 flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  Storages
                </span>
                <span className="text-lg font-semibold">
                  {totals.storageCount}
                </span>
                <span className="text-[11px] text-gray-400">
                  Unique main storage locations
                </span>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="py-3 flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  Tools checked
                </span>
                <span className="text-lg font-semibold">
                  {totals.toolsChecked} / {totals.toolsTotal}
                </span>
                <span className="text-[11px] text-gray-400">
                  Across all storages
                </span>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="py-3 flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  Overall progress
                </span>
                <AuditProgressBar
                  percent={
                    totals.toolsTotal
                      ? (totals.toolsChecked / totals.toolsTotal) * 100
                      : 0
                  }
                  showLabel={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Storages overview ({rows.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Main storage</TableHead>
                      <TableHead>Storage type</TableHead>
                      <TableHead>Audit status</TableHead>
                      <TableHead className="w-48">Audit progress</TableHead>
                      <TableHead className="text-right">
                        Tools checked
                      </TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Next audit</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const unitsLabel = unitLabel(row.storageType);
                      const href = `/admin-access/audits/storage?mainStorageName=${encodeURIComponent(
                        row.mainStorageName
                      )}&mainStorageCode=${encodeURIComponent(
                        row.mainStorageCode
                      )}`;

                      return (
                        <TableRow
                          key={`${row.mainStorageName}-${row.mainStorageCode}`}
                        >
                          <TableCell className="font-medium">
                            {row.mainStorageName}
                            <div className="text-[11px] text-gray-400">
                              Code: {row.mainStorageCode}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {row.storageUnitsCount} {unitsLabel}
                          </TableCell>
                          <TableCell>
                            <AuditStatusBadge status={row.auditStatus} />
                          </TableCell>
                          <TableCell>
                            <AuditProgressBar
                              percent={row.progressPercent}
                              showLabel={false}
                            />
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {row.toolsChecked} / {row.toolsTotal}
                            <div className="text-[10px] text-gray-400">
                              {row.individualToolsTotal} tools,{" "}
                              {row.toolkitsTotal} kits
                            </div>
                          </TableCell>
                          <TableCell>
                            <AuditCycleCount
                              cycleNumber={row.cycleNumber}
                              maxCycles={row.maxCycles}
                            />
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {formatNextAuditDate(row.nextAuditDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/dashboard/storages/view?mainStorageName=${encodeURIComponent(
                                row.mainStorageName
                              )}&mainStorageCode=${encodeURIComponent(
                                row.mainStorageCode
                              )}`}
                            >
                              <Button>View</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
