// hooks/useStorageDetailDashboard.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  StorageDetail,
  StatusCounts,
  QrLocationProgress,
  ToolkitsSummary,
} from "@/lib/services/StorageAuditDetailService";
import type { AuditCycleStatus } from "@/lib/models/AuditCycle.model";

export type StorageDetailDTO = StorageDetail & {
  nextAuditDate: string | null; // ISO from API
};

export function useStorageDetailDashboard(params: {
  mainDepartment?: string | null;
  mainStorageName?: string | null;
  mainStorageCode?: string | null;
}) {
  const { mainDepartment, mainStorageName, mainStorageCode } = params;

  const [data, setData] = useState<StorageDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!mainDepartment || !mainStorageName || !mainStorageCode) return;

    setLoading(true);
    setError(null);

    try {
      const search = new URLSearchParams({
        mainDepartment,
        mainStorageName,
        mainStorageCode,
      });

      const res = await fetch(
        `/api/dashboard/storage-detail?${search.toString()}`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }

      const payload = (await res.json()) as StorageDetailDTO;
      setData(payload);
    } catch (err: any) {
      console.error("Failed to load storage detail:", err);
      setError(err.message ?? "Failed to load storage detail");
    } finally {
      setLoading(false);
    }
  }, [mainDepartment, mainStorageName, mainStorageCode]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
