"use client";

import { useEffect, useState } from "react";
import type { QrLocationProgress } from "@/lib/services/StorageAuditDetailService";

// Same lightweight types you used in EQ5044
type QrLocationInfo = {
  rowName: string;
  qrCode: string;
};

type StorageLocationLight = {
  _id: string;
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  qrLocations?: QrLocationInfo[];
};

type Props = {
  locations: QrLocationProgress[];
};

export default function QrLocationsProgress({ locations }: Props) {
  const [qrLocationLabels, setQrLocationLabels] = useState<
    Record<string, string>
  >({});

  // --------------------------------
  // Load rowName labels for QR codes
  // --------------------------------
  useEffect(() => {
    const loadLabels = async () => {
      try {
        const res = await fetch("/api/storage-locations");
        const data: StorageLocationLight[] = await res.json();

        if (!res.ok || !Array.isArray(data)) return;

        const map: Record<string, string> = {};

        for (const storage of data) {
          if (!Array.isArray(storage.qrLocations)) continue;

          for (const qr of storage.qrLocations) {
            if (!qr.qrCode) continue;
            const rowLabel = qr.rowName || "Row";
            map[qr.qrCode] = `${rowLabel} (${qr.qrCode})`;
          }
        }

        setQrLocationLabels(map);
      } catch (err) {
        console.error("Failed to load QR row labels:", err);
      }
    };

    loadLabels();
  }, []);

  // --------------------------------
  // Empty state
  // --------------------------------
  if (!locations.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-xs text-gray-400">
        No QR locations found for this storage yet.
      </div>
    );
  }

  // --------------------------------
  // Render
  // --------------------------------
  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <h2 className="text-sm font-semibold">QR Locations Audit Progress</h2>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {locations.map((loc) => {
          const displayLabel =
            loc.qrLocation === "UNASSIGNED"
              ? "Unassigned"
              : qrLocationLabels[loc.qrLocation] ?? loc.qrLocation;

          return (
            <div key={loc.qrLocation} className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">{displayLabel}</span>

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
          );
        })}
      </div>
    </div>
  );
}
