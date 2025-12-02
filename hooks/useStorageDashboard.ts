"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditCycleStatus } from "@/lib/models/AuditCycle.model";

export type StorageDashboardRow = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType: string;

  storageUnitsCount: number;

  individualToolsTotal: number;
  toolkitsTotal: number;

  toolsTotal: number;
  toolsChecked: number;
  progressPercent: number;

  auditStatus: AuditCycleStatus;
  cycleNumber: number | null;
  maxCycles: number | null;
  nextAuditDate: string | null;
};

export function useStorageDashboard(mainDepartment?: string) {
  const [rows, setRows] = useState<StorageDashboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!mainDepartment) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ mainDepartment });
      const res = await fetch(`/api/dashboard/storages?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to load storages (${res.status})`);
      }

      const data = (await res.json()) as StorageDashboardRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load storage dashboard:", err);
      setError(err.message ?? "Failed to load storage dashboard");
    } finally {
      setLoading(false);
    }
  }, [mainDepartment]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, error, refresh: load };
}
