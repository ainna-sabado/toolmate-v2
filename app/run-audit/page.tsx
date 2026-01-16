"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import QRScanInput from "@/components/qrscan/QRScanInput";
import { useDepartment } from "@/context/DepartmentContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ArrowLeft, QrCode, TriangleAlert, CheckCircle2 } from "lucide-react";

/* ---------------------------------------------
 * Minimal types based on your existing endpoints
 * --------------------------------------------- */
type ToolKitLite = {
  _id: string;
  name: string;
  kitNumber: string;
  qrCode: string;
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  qrLocation: string;
  storageType: string;
};

type StorageLocationLite = {
  _id: string;
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType: string;
  qrLocations: { _id: string; rowName: string; qrCode: string }[];
};

type ResolveResult =
  | { type: "toolkit"; toolkitId: string }
  | {
      type: "storage";
      mainDepartment: string;
      mainStorageName: string;
      mainStorageCode: string;
      storageType?: string;
      qrLocation: string; // scanned code
      rowName?: string;
    };

export default function RunAuditScanPage() {
  const router = useRouter();
  const { mainDepartment } = useDepartment();

  const [lastScan, setLastScan] = useState<string>("");
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const deptLabel = useMemo(
    () => (mainDepartment?.trim() ? mainDepartment.trim() : "(no department selected)"),
    [mainDepartment]
  );

  const pushToAuditPage = useCallback(
    (resolved: ResolveResult) => {
      const params = new URLSearchParams();

      if (resolved.type === "toolkit") {
        params.set("type", "toolkit");
        params.set("toolkitId", resolved.toolkitId);
      } else {
        params.set("type", "storage");
        params.set("mainDepartment", resolved.mainDepartment);
        params.set("mainStorageName", resolved.mainStorageName);
        params.set("mainStorageCode", resolved.mainStorageCode);
        params.set("qrLocation", resolved.qrLocation);
        if (resolved.rowName) params.set("rowName", resolved.rowName);
        if (resolved.storageType) params.set("storageType", resolved.storageType);
      }

      router.push(`/run-audit/audit?${params.toString()}`);
    },
    [router]
  );

  /**
   * QR resolution strategy (works TODAY with your repo)
   * 1) Try to match Toolkit via GET /api/toolkits (by qrCode)
   * 2) Try to match Storage Row/Location via GET /api/storage-locations (by qrLocations[].qrCode)
   */
  const resolveQrClientSide = useCallback(
    async (qr: string): Promise<ResolveResult | null> => {
      const clean = qr.trim();
      if (!clean) return null;

      // 1) Toolkit lookup
      try {
        const tkUrl = new URL("/api/toolkits", window.location.origin);
        if (mainDepartment?.trim()) tkUrl.searchParams.set("mainDepartment", mainDepartment.trim());

        const tkRes = await fetch(tkUrl.toString(), { method: "GET" });
        if (tkRes.ok) {
          const tkJson = (await tkRes.json()) as { toolkits?: ToolKitLite[] };
          const toolkits = Array.isArray(tkJson?.toolkits) ? tkJson.toolkits : [];
          const match = toolkits.find((t) => String(t.qrCode).trim() === clean);
          if (match?._id) return { type: "toolkit", toolkitId: match._id };
        }
      } catch {
        // continue
      }

      // 2) Storage row/location lookup
      try {
        const stUrl = new URL("/api/storage-locations", window.location.origin);
        if (mainDepartment?.trim()) stUrl.searchParams.set("mainDepartment", mainDepartment.trim());

        const stRes = await fetch(stUrl.toString(), { method: "GET" });
        if (stRes.ok) {
          const list = (await stRes.json()) as StorageLocationLite[];
          const locations = Array.isArray(list) ? list : [];

          for (const loc of locations) {
            const row = (loc.qrLocations || []).find((q) => String(q.qrCode).trim() === clean);
            if (row) {
              return {
                type: "storage",
                mainDepartment: loc.mainDepartment,
                mainStorageName: loc.mainStorageName,
                mainStorageCode: loc.mainStorageCode,
                storageType: loc.storageType,
                qrLocation: clean,
                rowName: row.rowName,
              };
            }
          }
        }
      } catch {
        // continue
      }

      return null;
    },
    [mainDepartment]
  );

  const handleScan = useCallback(
    async (value: string) => {
      const qr = value.trim();
      if (!qr) return;

      setLastScan(qr);
      setIsResolving(true);
      setError("");
      setSuccessMsg("");

      try {
        const resolved = await resolveQrClientSide(qr);

        if (!resolved) {
          setError("QR not recognized. Scan a valid Toolkit QR or Storage Row/Location QR.");
          return;
        }

        setSuccessMsg(resolved.type === "toolkit" ? "Toolkit recognized." : "Storage location recognized.");
        pushToAuditPage(resolved);
      } finally {
        setIsResolving(false);
      }
    },
    [pushToAuditPage, resolveQrClientSide]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Run Inventory Audit
          </h1>
          <p className="text-sm text-muted-foreground">
            Scan a <span className="font-medium">Toolkit QR</span> or a{" "}
            <span className="font-medium">Storage Row/Location QR</span> to start.
          </p>
          <p className="text-xs text-muted-foreground">
            Department filter: <span className="font-medium">{deptLabel}</span>
          </p>
        </div>

        <Button variant="outline" onClick={() => router.push("/")} className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Scan Card */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Scan / Enter QR</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <QRScanInput
            onScan={handleScan}
            placeholder="Scan or type Toolkit QR / Storage Location QR"
          />

          {lastScan && (
            <div className="text-sm">
              Last scan: <span className="font-mono">{lastScan}</span>
            </div>
          )}

          {isResolving && (
            <div className="text-sm text-muted-foreground">Resolving QR…</div>
          )}

          {!!successMsg && !error && (
            <div className="flex items-start gap-2 rounded-lg border p-3">
              <CheckCircle2 className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Ready</div>
                <div className="text-muted-foreground">{successMsg}</div>
              </div>
            </div>
          )}

          {!!error && (
            <div className="flex items-start gap-2 rounded-lg border p-3">
              <TriangleAlert className="h-4 w-4 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Not found</div>
                <div className="text-muted-foreground">{error}</div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Next step: after scan, you’ll see the shadowboard image(s) and tool list, then mark tools as
            present or needing update.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
