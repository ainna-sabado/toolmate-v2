"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/helpers/StatusBadge";

import { ArrowLeft, Check, Pencil, Image as ImageIcon } from "lucide-react";

type AuditStatus = "present" | "needsUpdate" | "pending";

type StorageHeader = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType?: string;
  qrLocation: string;
  rowName?: string;
};

type ShadowboardImage = {
  _id?: string;
  url: string;
  label?: string;
  order: number;
};

type ShadowboardPayload = {
  _id: string;
  images: ShadowboardImage[];
} | null;

type ToolRow = {
  _id: string;
  name: string;
  eqNumber?: string;
  status: string;
  dueDate?: string | null;
};

type ToolKitRow = {
  _id: string;
  name: string;
  kitNumber: string;
  auditStatus: AuditStatus;
};

type ApiResponse = {
  type: "storage";
  storage: StorageHeader;
  shadowboard: ShadowboardPayload;
  tools: ToolRow[];
  toolkits: ToolKitRow[];
};

/* ---------------------------------------------
 * Date helper: DD MMM YY | fallback = NEN
 * --------------------------------------------- */
function formatDateDDMMMYY(d?: string | null) {
  if (!d) return "NEN";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "NEN";

  const day = String(dt.getDate()).padStart(2, "0");
  const month = dt.toLocaleString("en-NZ", { month: "short" });
  const year = String(dt.getFullYear()).slice(-2);

  return `${day} ${month} ${year}`;
}

export default function RunAuditAuditPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const mainDepartment = sp.get("mainDepartment") || "";
  const mainStorageName = sp.get("mainStorageName") || "";
  const mainStorageCode = sp.get("mainStorageCode") || "";
  const storageType = sp.get("storageType") || "";
  const qrLocation = sp.get("qrLocation") || "";
  const rowName = sp.get("rowName") || "";

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Shadowboard gallery
  const [activeShadowIdx, setActiveShadowIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Tool selection (present)
  const [selectedToolIds, setSelectedToolIds] = useState<Record<string, boolean>>(
    {}
  );

  const headerLine = useMemo(() => {
    const bits = [rowName?.trim(), qrLocation?.trim()].filter(Boolean);
    return bits.length ? bits.join(" • ") : qrLocation;
  }, [qrLocation, rowName]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("type", "storage");
        params.set("mainDepartment", mainDepartment);
        params.set("mainStorageName", mainStorageName);
        params.set("mainStorageCode", mainStorageCode);
        params.set("qrLocation", qrLocation);
        if (rowName) params.set("rowName", rowName);
        if (storageType) params.set("storageType", storageType);

        const res = await fetch(`/api/audits/context?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Failed to load audit context");
        if (cancelled) return;

        setData(json);
        setActiveShadowIdx(0);
        setZoomOpen(false);

        const initial: Record<string, boolean> = {};
        for (const t of json.tools || []) initial[t._id] = false;
        setSelectedToolIds(initial);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!mainDepartment || !mainStorageName || !mainStorageCode || !qrLocation) {
      setLoading(false);
      setError("Missing required query params. Go back and scan again.");
      return;
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    mainDepartment,
    mainStorageName,
    mainStorageCode,
    qrLocation,
    rowName,
    storageType,
  ]);

  const markAllPresent = () => {
    if (!data) return;
    const next: Record<string, boolean> = {};
    for (const t of data.tools || []) next[t._id] = true;
    setSelectedToolIds(next);
  };

  const unselectAll = () => {
    if (!data) return;
    const next: Record<string, boolean> = {};
    for (const t of data.tools || []) next[t._id] = false;
    setSelectedToolIds(next);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {data?.storage?.mainStorageName || "Audit"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.storage.mainStorageCode} • ${headerLine}`
              : `${mainStorageCode} • ${headerLine}`}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push("/run-audit")}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scan
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!!error && !loading && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Unable to load</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <>
          {/* Shadowboard gallery (unchanged) */}
          {/* … your existing gallery code stays exactly as-is … */}

          {/* Bulk actions */}
          <div className="flex gap-2">
            <Button onClick={markAllPresent}>Mark all as present</Button>
            <Button variant="outline" onClick={unselectAll}>
              Unselect all
            </Button>
          </div>

          {/* Toolkits */}
          {data.toolkits?.length ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Toolkits in this location</div>
              {data.toolkits.map((k) => (
                <div
                  key={k._id}
                  className={`rounded-xl border p-3 flex justify-between ${
                    k.auditStatus !== "pending"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="font-medium">{k.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Kit #{k.kitNumber}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {k.auditStatus !== "pending"
                      ? "Toolkit audit completed"
                      : "Audited separately"}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Tools */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Tools</div>

            {data.tools.length ? (
              data.tools.map((t) => {
                const selected = !!selectedToolIds[t._id];
                return (
                  <div
                    key={t._id}
                    className={`rounded-xl border p-3 ${
                      selected
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-medium">{t.name}</div>
                          <StatusBadge value={t.status} />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {t.eqNumber ? `EQ: ${t.eqNumber}` : "EQ: NEN"}
                          {" • "}Cal due: {formatDateDDMMMYY(t.dueDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={selected ? "secondary" : "default"}
                          onClick={() =>
                            setSelectedToolIds((prev) => ({
                              ...prev,
                              [t._id]: !prev[t._id],
                            }))
                          }
                        >
                          <Check className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => alert("Needs update (next step)")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">
                No tools found for this QR location.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
