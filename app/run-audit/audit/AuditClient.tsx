"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEffectiveStatus } from "@/lib/helpers/calibration";
import { StatusBadge } from "@/components/helpers/StatusBadge";

import {
  ArrowLeft,
  Check,
  Pencil,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  EyeOff,
  Eye,
  X,
  Pin,
} from "lucide-react";

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

type ShadowboardPayload =
  | {
      _id: string;
      images: ShadowboardImage[];
    }
  | null;

type ToolRow = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  eqNumber?: string;
  qty?: number;
  status: string;
  dueDate?: string | null;
  auditStatus?: AuditStatus;
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

// DD MMM YY (e.g., 16 Jan 26). Missing/invalid => NEN
function formatDateDDMMMYY(d?: string | null) {
  if (!d) return "NEN";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "NEN";

  const day = String(dt.getDate()).padStart(2, "0");
  const month = dt.toLocaleString("en-NZ", { month: "short" });
  const year2 = String(dt.getFullYear()).slice(-2);

  return `${day} ${month} ${year2}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Drag-to-pan for an overflow container (drag to scroll).
 * Great with your current "zoom by increasing width" approach.
 */
function useDragToScroll<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T | null>(null);

  const stateRef = useRef<{
    dragging: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  }>({
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      const el = ref.current;
      if (!el) return;

      if (e.pointerType === "mouse" && e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest?.("button, a, input, textarea, select, [role='button']")) return;

      const canPan = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      if (!canPan) return;

      stateRef.current.dragging = true;
      stateRef.current.pointerId = e.pointerId;
      stateRef.current.startX = e.clientX;
      stateRef.current.startY = e.clientY;
      stateRef.current.startScrollLeft = el.scrollLeft;
      stateRef.current.startScrollTop = el.scrollTop;

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // no-op
      }

      e.preventDefault();
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      const el = ref.current;
      if (!el) return;

      if (!stateRef.current.dragging) return;
      if (stateRef.current.pointerId !== e.pointerId) return;

      const dx = e.clientX - stateRef.current.startX;
      const dy = e.clientY - stateRef.current.startY;

      el.scrollLeft = stateRef.current.startScrollLeft - dx;
      el.scrollTop = stateRef.current.startScrollTop - dy;

      e.preventDefault();
    },
    [enabled]
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (!stateRef.current.dragging) return;
    if (stateRef.current.pointerId !== e.pointerId) return;

    stateRef.current.dragging = false;
    stateRef.current.pointerId = null;

    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // no-op
    }
  }, []);

  const dragClassName = enabled ? "cursor-grab active:cursor-grabbing touch-none" : "";

  return { ref, onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, dragClassName };
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

  // Shadowboard gallery state
  const [activeShadowIdx, setActiveShadowIdx] = useState(0);

  // Zoom state (shared between dock + modal)
  const Z_MIN = 1;
  const Z_MAX = 3;
  const Z_STEP = 0.25;
  const [zoom, setZoom] = useState<number>(1);

  // Docked panel (original) is default ON
  const [shadowDocked, setShadowDocked] = useState(true);

  // Modal overlay access (available anywhere)
  const [shadowModalOpen, setShadowModalOpen] = useState(false);

  // Show floating launcher when panel is not visible (or docked is off)
  const [shadowPanelInView, setShadowPanelInView] = useState(true);
  const shadowPanelRef = useRef<HTMLDivElement | null>(null);

  // UI-only selection (mock for now)
  const [selectedToolIds, setSelectedToolIds] = useState<Record<string, boolean>>({});

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

        // reset gallery + zoom
        setActiveShadowIdx(0);
        setZoom(1);

        // default UX
        setShadowDocked(true);
        setShadowModalOpen(false);

        // initialize selection state (amber by default)
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

  const imagesSorted = useMemo(() => {
    const imgs = data?.shadowboard?.images?.slice() ?? [];
    return imgs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [data?.shadowboard?.images]);

  const activeImage = useMemo(() => {
    if (!imagesSorted.length) return null;
    const safe = clamp(activeShadowIdx, 0, imagesSorted.length - 1);
    return {
      img: imagesSorted[safe],
      idx: safe,
      total: imagesSorted.length,
    };
  }, [imagesSorted, activeShadowIdx]);

  // Reset zoom when switching image
  useEffect(() => {
    setZoom(1);
  }, [activeImage?.img?.url]);

  const zoomIn = useCallback(() => setZoom((z) => clamp(Number((z + Z_STEP).toFixed(2)), Z_MIN, Z_MAX)), []);
  const zoomOut = useCallback(() => setZoom((z) => clamp(Number((z - Z_STEP).toFixed(2)), Z_MIN, Z_MAX)), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  const onWheelZoom = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        setZoom((z) => clamp(Number((z + direction * 0.15).toFixed(2)), Z_MIN, Z_MAX));
      }
    },
    [Z_MIN, Z_MAX]
  );

  // Drag-to-pan inside viewports when zoomed in
  const dockDrag = useDragToScroll<HTMLDivElement>(zoom > 1);
  const modalDrag = useDragToScroll<HTMLDivElement>(zoom > 1);

  // Detect when the docked panel is in view (so we can show the floating launcher only when needed)
  useEffect(() => {
    const el = shadowPanelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShadowPanelInView(!!entry?.isIntersecting);
      },
      {
        // When ~30% of the panel is visible, consider it "in view"
        threshold: 0.3,
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [shadowDocked, data]);

  const showShadowLauncher = !!data && !loading && !error && activeImage && (!shadowDocked || !shadowPanelInView);

  const openShadowModal = useCallback(() => {
    if (!activeImage) return;
    setShadowModalOpen(true);
  }, [activeImage]);

  const closeShadowModal = useCallback(() => {
    setShadowModalOpen(false);
  }, []);

  // ESC closes modal
  useEffect(() => {
    if (!shadowModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShadowModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shadowModalOpen, closeShadowModal]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{data?.storage?.mainStorageName || "Audit"}</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.storage.mainStorageCode} • ${headerLine}` : `${mainStorageCode} • ${headerLine}`}
          </p>
        </div>

        <Button variant="outline" onClick={() => router.push("/run-audit")} className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scan
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading audit context…</div>}

      {!!error && !loading && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Unable to load</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      )}

      {/* Floating Shadowboard Launcher (only when needed) */}
      {showShadowLauncher ? (
        <div className="fixed bottom-4 left-4 z-40">
          <Button
            variant="secondary"
            className="rounded-full shadow-lg"
            onClick={openShadowModal}
            title="Open shadowboard"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Shadowboard
          </Button>
        </div>
      ) : null}

      {/* Shadowboard Modal Overlay (accessible anywhere) */}
      {shadowModalOpen && activeImage ? (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-3 sm:p-6 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={closeShadowModal}
        >
          <div
            className="w-full max-w-6xl bg-background rounded-2xl shadow-xl overflow-hidden border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <div className="min-w-0">
                <div className="font-semibold leading-tight">Shadowboard</div>
                <div className="text-xs text-muted-foreground truncate">
                  {data?.storage?.mainStorageCode} • {headerLine}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    setShadowDocked(true);
                    setShadowModalOpen(false);
                    // gentle nudge toward top on mobile/short screens
                    window.scrollTo({ top: Math.max(0, (window.scrollY || 0) - 120), behavior: "smooth" });
                  }}
                  title="Restore the original docked panel"
                >
                  <Pin className="h-4 w-4 mr-2" />
                  Pin back
                </Button>

                <Button variant="outline" size="sm" className="rounded-xl" onClick={closeShadowModal}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-4 grid gap-4 lg:grid-cols-[1fr_260px]">
              {/* Viewer */}
              <div className="space-y-3">
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={zoomOut}
                    disabled={zoom <= Z_MIN}
                    title="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={zoomIn}
                    disabled={zoom >= Z_MAX}
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={zoomReset}
                    disabled={zoom === 1}
                    title="Reset zoom"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>

                  <div className="ml-auto text-xs text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</div>
                </div>

                {/* Image viewport */}
                <div
                  ref={modalDrag.ref}
                  onPointerDown={modalDrag.onPointerDown}
                  onPointerMove={modalDrag.onPointerMove}
                  onPointerUp={modalDrag.onPointerUp}
                  onPointerCancel={modalDrag.onPointerCancel}
                  className={[
                    "relative w-full overflow-auto rounded-2xl border bg-white",
                    modalDrag.dragClassName,
                  ].join(" ")}
                  onWheel={onWheelZoom}
                  style={{ maxHeight: "70vh" }}
                  aria-label="Shadowboard modal viewport"
                  title={zoom > 1 ? "Drag to pan • Wheel/trackpad to zoom" : "Wheel/trackpad to zoom"}
                >
                  <img
                    src={activeImage.img.url}
                    alt={activeImage.img.label || "Shadowboard"}
                    className="block max-w-none select-none"
                    draggable={false}
                    style={{
                      width: `${zoom * 100}%`,
                      height: "auto",
                    }}
                  />

                  <div className="sticky bottom-0 left-0 right-0 bg-black/35 text-white px-3 py-2 text-xs flex items-center justify-between">
                    <span className="truncate">
                      {activeImage.img.label?.trim() ? activeImage.img.label : "Shadowboard image"}
                    </span>
                    <span className="opacity-80">
                      {activeImage.idx + 1}/{activeImage.total}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Tip: zoom in then drag the image to pan. You can open this from anywhere while auditing.
                </div>
              </div>

              {/* Thumbnails column */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Images</div>

                {imagesSorted.length ? (
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 max-h-[70vh] overflow-auto pr-1">
                    {imagesSorted.map((img, idx) => {
                      const isActive = idx === activeImage.idx;
                      return (
                        <button
                          key={`${img._id ?? img.url}-${img.order ?? 0}-${idx}`}
                          type="button"
                          onClick={() => setActiveShadowIdx(idx)}
                          className={[
                            "rounded-xl overflow-hidden border text-left",
                            isActive ? "border-emerald-400 ring-2 ring-emerald-200" : "border-muted",
                          ].join(" ")}
                          title={img.label || `Image ${idx + 1}`}
                        >
                          <img src={img.url} alt={img.label || "Shadowboard thumbnail"} className="h-24 w-full object-cover" />
                          <div className="px-2 py-1 text-xs text-muted-foreground truncate">
                            {img.label?.trim() ? img.label : `Image ${idx + 1}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No images assigned.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !error && data && (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* LEFT: Original Sticky Shadowboard panel (default) */}
          <div className="space-y-6 md:sticky md:top-6 self-start">
            <div ref={shadowPanelRef}>
              {shadowDocked ? (
                <Card className="rounded-xl">
                  <CardHeader className="gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">Shadowboard</CardTitle>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setShadowDocked(false)}
                          title="Hide the docked shadowboard panel"
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </Button>

                        {activeImage ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={openShadowModal}
                            title="Open shadowboard overlay (accessible anywhere)"
                          >
                            <Maximize2 className="h-4 w-4 mr-2" />
                            Open
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {/* Zoom controls */}
                    {activeImage ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={zoomOut}
                          disabled={zoom <= Z_MIN}
                          title="Zoom out"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={zoomIn}
                          disabled={zoom >= Z_MAX}
                          title="Zoom in"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={zoomReset}
                          disabled={zoom === 1}
                          title="Reset zoom"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>

                        <div className="ml-auto text-xs text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</div>
                      </div>
                    ) : null}
                  </CardHeader>

                  <CardContent>
                    {activeImage ? (
                      <div className="space-y-3">
                        <div
                          ref={dockDrag.ref}
                          onPointerDown={dockDrag.onPointerDown}
                          onPointerMove={dockDrag.onPointerMove}
                          onPointerUp={dockDrag.onPointerUp}
                          onPointerCancel={dockDrag.onPointerCancel}
                          className={[
                            "relative w-full overflow-auto rounded-xl border bg-white",
                            dockDrag.dragClassName,
                          ].join(" ")}
                          onWheel={onWheelZoom}
                          style={{ maxHeight: 520 }}
                          aria-label="Shadowboard image viewport"
                          title={zoom > 1 ? "Drag to pan • Wheel/trackpad to zoom" : "Wheel/trackpad to zoom"}
                        >
                          <img
                            src={activeImage.img.url}
                            alt={activeImage.img.label || "Shadowboard"}
                            className="block max-w-none select-none"
                            draggable={false}
                            style={{
                              width: `${zoom * 100}%`,
                              height: "auto",
                            }}
                          />

                          <div className="sticky bottom-0 left-0 right-0 bg-black/35 text-white px-3 py-2 text-xs flex items-center justify-between">
                            <span className="truncate">
                              {activeImage.img.label?.trim() ? activeImage.img.label : "Shadowboard image"}
                            </span>
                            <span className="opacity-80">
                              {activeImage.idx + 1}/{activeImage.total}
                            </span>
                          </div>
                        </div>

                        {imagesSorted.length > 1 ? (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {imagesSorted.map((img, idx) => {
                              const isActive = idx === activeImage.idx;
                              return (
                                <button
                                  key={`${img._id ?? img.url}-${img.order ?? 0}-${idx}`}
                                  type="button"
                                  onClick={() => setActiveShadowIdx(idx)}
                                  className={[
                                    "relative shrink-0 rounded-lg overflow-hidden border",
                                    isActive ? "border-emerald-400 ring-2 ring-emerald-200" : "border-muted",
                                  ].join(" ")}
                                  title={img.label || `Image ${idx + 1}`}
                                >
                                  <img src={img.url} alt={img.label || "Shadowboard thumbnail"} className="h-20 w-28 object-cover" />
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className="text-xs text-muted-foreground">
                          Tip: zoom in then drag to pan. If you scroll away, use the floating Shadowboard button.
                        </div>
                      </div>
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
              ) : (
                // Dock hidden, but user can restore it (and modal is always available)
                <Card className="rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">Shadowboard hidden</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Use the floating button anytime, or pin it back here.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setShadowDocked(true)}
                        title="Show the docked shadowboard panel"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Show
                      </Button>
                      {activeImage ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl"
                          onClick={openShadowModal}
                          title="Open shadowboard overlay"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* RIGHT: Audit content */}
          <div className="space-y-6">
            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={markAllPresent} className="rounded-xl">
                Mark all as present
              </Button>
              <Button variant="outline" onClick={unselectAll} className="rounded-xl">
                Unselect all
              </Button>
            </div>

            {/* Toolkits (read-only in storage audit) */}
            {data.toolkits?.length ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">Toolkits in this location</div>
                <div className="space-y-2">
                  {data.toolkits.map((k) => {
                    const isComplete = k.auditStatus !== "pending";
                    const cls = isComplete ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50";

                    return (
                      <div key={k._id} className={`rounded-xl border p-3 flex items-center justify-between ${cls}`}>
                        <div>
                          <div className="font-medium">{k.name}</div>
                          <div className="text-xs text-muted-foreground">Kit #{k.kitNumber}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isComplete ? "Toolkit audit completed" : "Audited separately"}
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
                    const cls = selected ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50";

                    return (
                      <div key={t._id} className={`rounded-xl border p-3 ${cls}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-medium truncate">{t.name}</div>
                              <StatusBadge value={getEffectiveStatus(t.status, t.dueDate ?? null)} kind="status" />
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
                <div className="text-sm text-muted-foreground">No tools found for this QR location.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
