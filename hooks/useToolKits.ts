// hooks/useToolKits.ts
"use client";

import { useEffect, useState, useCallback } from "react";

export function useToolKits(mainDepartment?: string) {
  const [kits, setKits] = useState<any[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadKits = useCallback(async () => {
    if (!mainDepartment) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/toolkits?mainDepartment=${encodeURIComponent(mainDepartment)}`
      );
      const data = await res.json();
      setKits(data.toolkits || []);
      setStorageLocations(data.storageLocations || []);
    } catch (err) {
      console.error("Failed to load toolkits:", err);
    } finally {
      setLoading(false);
    }
  }, [mainDepartment]);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  return { kits, storageLocations, loading, refresh: loadKits };
}
