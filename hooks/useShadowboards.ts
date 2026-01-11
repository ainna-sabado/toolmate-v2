"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ShadowboardScopeType = "storage" | "toolkit";

export type ShadowboardImage = {
  _id?: string;
  url: string;
  label?: string;
  order: number;
};

export type ShadowboardSequenceItem =
  | {
      _id?: string;
      itemType: "tool" | "toolkit";
      itemId: string;
      itemModel: "Tool" | "ToolKit";
      order: number;
    }
  | {
      _id?: string;
      itemType: "kitContent";
      parentKitId: string;
      kitContentId: string;
      order: number;
    };

export type Shadowboard = {
  _id: string;

  scopeType: ShadowboardScopeType;

  // storage
  mainDepartment?: string;
  mainStorageName?: string;
  mainStorageCode?: string;
  qrLocation?: string | null;

  // toolkit
  toolkitId?: string;

  title?: string;
  description?: string;

  images: ShadowboardImage[];
  sequence: ShadowboardSequenceItem[];

  version?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ShadowboardFilters =
  | {
      scopeType: "storage";
      mainDepartment?: string;
      mainStorageName?: string;
      mainStorageCode?: string;
      qrLocation?: string | null;
    }
  | {
      scopeType: "toolkit";
      mainDepartment?: string; // keep your rule: must have dept selected
      toolkitId?: string;
    };

export function useShadowboards(filters: ShadowboardFilters) {
  const [shadowboards, setShadowboards] = useState<Shadowboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => {
    if (filters.scopeType === "toolkit") {
      return {
        scopeType: "toolkit" as const,
        mainDepartment: String(filters.mainDepartment ?? "").trim(),
        toolkitId: String(filters.toolkitId ?? "").trim(),
      };
    }

    const mainDepartment = String(filters.mainDepartment ?? "").trim();
    const mainStorageName = String(filters.mainStorageName ?? "").trim();
    const mainStorageCode = String(filters.mainStorageCode ?? "").trim();

    const qrLocation =
      filters.qrLocation === undefined
        ? undefined
        : filters.qrLocation === null
        ? null
        : String(filters.qrLocation).trim();

    return { scopeType: "storage" as const, mainDepartment, mainStorageName, mainStorageCode, qrLocation };
  }, [filters]);

  const canLoad = useMemo(() => {
    // Keep your rule: do NOT load unless department is set
    if (!normalized.mainDepartment) return false;

    if (normalized.scopeType === "toolkit") {
      return !!normalized.toolkitId;
    }

    return !!normalized.mainStorageName && !!normalized.mainStorageCode;
  }, [normalized]);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("scopeType", normalized.scopeType);

    if (normalized.scopeType === "toolkit") {
      params.set("toolkitId", normalized.toolkitId);
      return `/api/shadowboards?${params.toString()}`;
    }

    params.set("mainDepartment", normalized.mainDepartment);
    params.set("mainStorageName", normalized.mainStorageName);
    params.set("mainStorageCode", normalized.mainStorageCode);

    if (normalized.qrLocation !== undefined) {
      params.set("qrLocation", normalized.qrLocation ?? "");
    }

    return `/api/shadowboards?${params.toString()}`;
  }, [normalized]);

  const refresh = useCallback(async () => {
    if (!canLoad) {
      setShadowboards([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(buildUrl(), { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Failed to load shadowboards (${res.status})`);
      }

      setShadowboards(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setShadowboards([]);
      setError(e?.message ?? "Failed to load shadowboards");
    } finally {
      setIsLoading(false);
    }
  }, [canLoad, buildUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createShadowboard = useCallback(
    async (payload: Partial<Shadowboard>) => {
      const res = await fetch("/api/shadowboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Failed to create shadowboard");
      await refresh();
      return data;
    },
    [refresh]
  );

  const updateShadowboard = useCallback(
    async (id: string, payload: Partial<Shadowboard>) => {
      const res = await fetch(`/api/shadowboards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || "Failed to update shadowboard");
      await refresh();
      return data;
    },
    [refresh]
  );

  const deleteShadowboard = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/shadowboards/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to delete shadowboard");
      await refresh();
      return data;
    },
    [refresh]
  );

  return { shadowboards, isLoading, error, canLoad, refresh, createShadowboard, updateShadowboard, deleteShadowboard };
}
