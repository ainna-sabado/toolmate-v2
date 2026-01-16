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
  brand?: string;
  category?: string;
  eqNumber?: string;
  qty?: number;
  status: string;
  dueDate?: string | null;
  auditStatus?: AuditStatus; // kept optional (API still sends it)
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

// DD MMM YY (e.g., 16 Jan 26). If missing/invalid => NEN
function formatDateDDMMMYY(d?: string | null) {
  if (!d) return "NEN";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "NEN";

  const day = String(dt.getDate()).padStart(2, "0");
  const month = dt.toLocaleString("en-NZ", { month: "short" });
  const year2 = String(dt.getFullYear()).slice(-2);

  return `${day} ${month} ${year2}`;
}

export default function AuditClient() {
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

  // UI-only selection (mock for now)
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
        const json = (await res.json()) as any;

        if (!res.ok) throw new Error(json?.error || "Failed to load audit context");
        if (cancelled) return;

        const ctx = json as ApiResponse;
        setData(ctx);

        // reset gallery
        setActiveShadowIdx(0);
        setZoomOpen(false);

        // init selection state (amber by default)
        const initial: Record<string, boolean> = {};
        for (const t of ctx.tools || []) initial[t._id] = false;
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
  }, [mainDepartment, mainStorageName, mainStorageCode, qrLocation, rowName, storageType]);

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
        <div className="space-y-1">
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

      {loading && (
        <div className="text-sm text-muted-foreground">
          Loading audit context…
        </div>
      )}

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
          {/* Shadowboard (gallery) */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Shadowboard</CardTitle>
            </CardHeader>

            <CardContent>
              {data.shadowboard?.images?.length ? (
                (() => {
                  const images = data.shadowboard!.images
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                  const safeActive = Math.min(
                    Math.max(activeShadowIdx, 0),
                    images.length - 1
                  );
                  const active = images[safeActive];

                  return (
                    <div className="space-y-3">
                      <button
                        type="button"
                        className="relative w-full overflow-hidden rounded-xl border bg-white"
                        onClick={() => setZoomOpen(true)}
                        title="Click to zoom"
                      >
                        <img
                          src={active.url}
                          alt={active.label || "Shadowboard"}
                          className="w-full h-72 sm:h-96 object-cover"
                        />

                        <div className="absolute bottom-0 left-0 right-0 bg-black/35 text-white px-3 py-2 text-xs flex items-center justify-between">
                          <span className="truncate">
                            {active.label?.trim() ? active.label : "Shadowboard image"}
                          </span>
                          <span className="opacity-80">
                            {safeActive + 1}/{images.length}
                          </span>
                        </div>
                      </button>

                      {images.length > 1 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {images.map((img, idx) => {
                            const isActive = idx === safeActive;
                            return (
                              <button
                                key={`${img._id ?? img.url}-${img.order ?? 0}-${idx}`}
                                type="button"
                                onClick={() => setActiveShadowIdx(idx)}
                                className={[
                                  "relative shrink-0 rounded-lg overflow-hidden border",
                                  isActive
                                    ? "border-emerald-400 ring-2 ring-emerald-200"
                                    : "border-muted",
                                ].join(" ")}
                                title={img.label || `Image ${idx + 1}`}
                              >
                                <img
                                  src={img.url}
                                  alt={img.label || "Shadowboard thumbnail"}
                                  className="h-20 w-28 object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {zoomOpen ? (
                        <div
                          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                          onClick={() => setZoomOpen(false)}
                          role="dialog"
                          aria-modal="true"
                        >
                          <div
                            className="relative max-w-5xl w-full max-h-[85vh] rounded-xl overflow-hidden bg-black"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={active.url}
                              alt={active.label || "Shadowboard zoom"}
                              className="w-full h-full object-contain bg-black"
                            />

                            <div className="absolute top-3 right-3">
                              <Button
                                variant="secondary"
                                className="rounded-xl"
                                onClick={() => setZoomOpen(false)}
                              >
                                Close
                              </Button>
                            </div>

                            {active.label?.trim() ? (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white px-3 py-2 text-sm">
                                {active.label}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-xl border bg-muted/30 p-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">No shadowboard available</div>
                    <div className="text-sm text-muted-foreground">
                      Assign an image in Manage Shadowboards to improve audit accuracy.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={markAllPresent} className="rounded-xl">
              Mark all as present
            </Button>
            <Button
              variant="outline"
              onClick={unselectAll}
              className="rounded-xl"
            >
              Unselect all
            </Button>
          </div>

          {/* Toolkits (read-only in storage audit) */}
          {data.toolkits?.length ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Toolkits in this location
              </div>
              <div className="space-y-2">
                {data.toolkits.map((k) => {
                  const isComplete = k.auditStatus !== "pending";
                  const cls = isComplete
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50";

                  return (
                    <div
                      key={k._id}
                      className={`rounded-xl border p-3 flex items-center justify-between ${cls}`}
                    >
                      <div>
                        <div className="font-medium">{k.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Kit #{k.kitNumber}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isComplete
                          ? "Toolkit audit completed"
                          : "Audited separately"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Tools */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Tools</div>

            {data.tools?.length ? (
              <div className="space-y-2">
                {data.tools.map((t) => {
                  const selected = !!selectedToolIds[t._id];
                  const cls = selected
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50";

                  return (
                    <div key={t._id} className={`rounded-xl border p-3 ${cls}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium truncate">{t.name}</div>
                            <StatusBadge value={t.status} kind="status" />
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {t.eqNumber ? `EQ: ${t.eqNumber}` : "EQ: NEN"}
                            {" • "}Cal due: {formatDateDDMMMYY(t.dueDate ?? null)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant={selected ? "secondary" : "default"}
                            className="rounded-xl"
                            onClick={() =>
                              setSelectedToolIds((prev) => ({
                                ...prev,
                                [t._id]: !prev[t._id],
                              }))
                            }
                            title="Mark present"
                          >
                            <Check className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => alert("Needs update flow (next step)")}
                            title="Needs update"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
