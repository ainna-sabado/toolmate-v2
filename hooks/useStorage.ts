"use client";

import { useEffect, useState, useCallback } from "react";

// Match StorageLocation model shape we care about
type QrLocation = {
  _id: string;
  rowName: string;
  qrCode: string;
};

type StorageLocation = {
  _id: string;
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType: string;
  qrLocations?: QrLocation[];
};

export function useStorage(mainDepartment?: string) {
  const [storages, setStorages] = useState<StorageLocation[]>([]);
  const [qrLocations, setQrLocations] = useState<QrLocation[]>([]);

  // ------------------------
  // LOAD MAIN STORAGES
  // ------------------------
  const loadStorages = useCallback(async () => {
    if (!mainDepartment) return;

    try {
      const res = await fetch(
        `/api/storage-locations?mainDepartment=${encodeURIComponent(
          mainDepartment
        )}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load storages");
      }

      setStorages(data || []);
    } catch (err) {
      console.error("Failed to load storages:", err);
    }
  }, [mainDepartment]);

  // ------------------------
  // LOAD QR LOCATIONS FOR A GIVEN STORAGE
  // (Now purely from the already-loaded storages)
  // ------------------------
  const loadQrLocations = useCallback(
    (storageName: string) => {
      if (!storageName) {
        setQrLocations([]);
        return;
      }

      const storage = storages.find(
        (s) => s.mainStorageName === storageName
      );

      setQrLocations(storage?.qrLocations || []);
    },
    [storages]
  );

  useEffect(() => {
    loadStorages();
  }, [loadStorages]);

  return { storages, qrLocations, loadStorages, loadQrLocations };
}
