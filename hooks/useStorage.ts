// hooks/useStorage.ts
"use client";

import { useEffect, useState, useCallback } from "react";

export function useStorage(mainDepartment?: string) {
  const [storages, setStorages] = useState<any[]>([]);
  const [qrLocations, setQrLocations] = useState<string[]>([]);

  const loadStorages = useCallback(async () => {
    if (!mainDepartment) return;

    try {
      const res = await fetch(
        `/api/tools?mainDepartment=${encodeURIComponent(mainDepartment)}&storages=1`
      );
      const data = await res.json();
      setStorages(data.storages || []);
    } catch (err) {
      console.error("Failed to load storages:", err);
    }
  }, [mainDepartment]);

  const loadQrLocations = useCallback(
    async (storageName: string) => {
      if (!mainDepartment || !storageName) return;

      try {
        const res = await fetch(
          `/api/tools?mainDepartment=${encodeURIComponent(
            mainDepartment
          )}&mainStorageName=${encodeURIComponent(storageName)}`
        );
        const data = await res.json();

        const uniq = new Set<string>();
        data.tools?.forEach((t: any) => {
          if (t.qrLocation) uniq.add(t.qrLocation);
        });

        setQrLocations([...uniq]);
      } catch (err) {
        console.error("Failed to load QR locations:", err);
      }
    },
    [mainDepartment]
  );

  useEffect(() => {
    loadStorages();
  }, [loadStorages]);

  return { storages, qrLocations, loadStorages, loadQrLocations };
}
