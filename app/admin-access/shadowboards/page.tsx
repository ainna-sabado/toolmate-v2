"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useDepartment } from "@/context/DepartmentContext";
import { useStorage } from "@/hooks/useStorage";
import { useTools } from "@/hooks/useTools";
import { useToolKits } from "@/hooks/useToolKits";
import {
  useShadowboards,
  type Shadowboard,
  type ShadowboardImage,
  type ShadowboardSequenceItem,
} from "@/hooks/useShadowboards";

import { StrictCombobox } from "@/components/ui/strict-combobox";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Image as ImageIcon,
  LayoutTemplate,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

/* ----------------------------- */
/* Guardrails                    */
/* ----------------------------- */

const MAX_IMAGES = 10;
const MAX_IMAGE_BLOB_BYTES = 450 * 1024; // 450KB (post-compress)
const MAX_TOTAL_DATAURL_BYTES_APPROX = 3_500_000; // ~3.5MB per save request (conservative)
const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_WEBP_QUALITY = 0.82;

/* ----------------------------- */
/* Helpers                       */
/* ----------------------------- */

function nen(value?: string) {
  const v = String(value ?? "").trim();
  return v ? v : "NEN";
}

function storageLabel(s: any) {
  return `${s.mainStorageName} (${s.mainStorageCode})`;
}

function reorder<T>(list: T[], fromIndex: number, toIndex: number) {
  const next = list.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

// Rough byte estimate for a data URL string
function approxBytesOfString(s: string) {
  return s.length;
}

async function fileToWebpDataUrl(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
) {
  const maxWidth = opts?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = opts?.quality ?? DEFAULT_WEBP_QUALITY;

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported on this device.");

  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );

  if (!blob) throw new Error("Failed to compress image.");

  if (blob.size > MAX_IMAGE_BLOB_BYTES) {
    throw new Error(
      `Image too large after compression (${Math.round(
        blob.size / 1024
      )}KB). Try a smaller photo.`
    );
  }

  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return dataUrl;
}

/* ----------------------------- */
/* Types                         */
/* ----------------------------- */

type TabKey = "storage" | "toolkits";

type SequenceRow =
  | {
      kind: "tool";
      id: string;
      label: string;
      eqNumber?: string;
      location?: string;
    }
  | {
      kind: "toolkit";
      id: string;
      label: string;
      kitNumber?: string;
      location?: string;
    }
  | {
      kind: "kitContent";
      id: string; // kitContentId
      parentKitId: string;
      label: string;
      eqNumber?: string;
      qty?: number;
    };

/* ----------------------------- */
/* Page                          */
/* ----------------------------- */

export default function ManageShadowboardsPage() {
  const router = useRouter();
  const { mainDepartment } = useDepartment();

  const { storages } = useStorage(mainDepartment);
  const { tools } = useTools(mainDepartment as any);
  const { toolkits } = useToolKits(mainDepartment as any);

  const [tab, setTab] = useState<TabKey>("storage");

  /* ----------------------------- */
  /* Storage selection             */
  /* ----------------------------- */

  const [selectedStorageId, setSelectedStorageId] = useState("");
  const selectedStorage = useMemo(
    () =>
      (storages || []).find((s: any) => s._id === selectedStorageId) || null,
    [storages, selectedStorageId]
  );

  const [selectedQrLocation, setSelectedQrLocation] = useState<string>(""); // "" = whole storage

  const storageOptions = useMemo(() => {
    return (storages || [])
      .map((s: any) => ({ id: s._id, label: storageLabel(s) }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
  }, [storages]);

  const qrLocations = useMemo(
    () => selectedStorage?.qrLocations || [],
    [selectedStorage]
  );

  // label -> qrCode
  const qrLocationMap = useMemo(() => {
    const map = new Map<string, string>();
    (qrLocations || []).forEach((q: any) => {
      const qrCode = String(q.qrCode || "").trim();
      if (!qrCode) return;
      const rowName = String(q.rowName || "")
        .trim()
        .toUpperCase();
      const label = rowName ? `${rowName} (${qrCode})` : qrCode;
      map.set(label, qrCode);
    });
    return map;
  }, [qrLocations]);

  const qrLocationStrictOptions = useMemo(() => {
    return Array.from(qrLocationMap.entries())
      .map(([label, qrCode]) => ({ id: qrCode, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [qrLocationMap]);

  // reset dependent row when storage changes
  useEffect(() => {
    setSelectedQrLocation("");
  }, [selectedStorageId]);

  /* ----------------------------- */
  /* Toolkit selection             */
  /* ----------------------------- */

  const [selectedToolkitId, setSelectedToolkitId] = useState("");

  const toolkitOptions = useMemo(() => {
    return (toolkits || [])
      .map((k: any) => ({
        id: k._id,
        label: `ToolKit — ${k.name} (${nen(k.kitNumber)}) • ${
          k.mainStorageName
        } (${k.mainStorageCode}) • ${k.qrLocation}`,
        keywords: `${k.name} ${k.kitNumber ?? ""} ${k.mainStorageName ?? ""} ${
          k.mainStorageCode ?? ""
        } ${k.qrLocation ?? ""}`,
      }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label));
  }, [toolkits]);

  const selectedToolkit = useMemo(
    () =>
      (toolkits || []).find((k: any) => k._id === selectedToolkitId) || null,
    [toolkits, selectedToolkitId]
  );

  // When switching scope tabs, clear the opposite selections to avoid weird state
  useEffect(() => {
    if (tab === "storage") setSelectedToolkitId("");
    if (tab === "toolkits") {
      setSelectedStorageId("");
      setSelectedQrLocation("");
    }
  }, [tab]);

  /* ----------------------------- */
  /* Shadowboard loading           */
  /* ----------------------------- */

  const shadowFilters = useMemo(() => {
    if (tab === "toolkits") {
      return {
        scopeType: "toolkit" as const,
        mainDepartment,
        toolkitId: selectedToolkitId || undefined,
      };
    }

    if (!selectedStorage) {
      return {
        scopeType: "storage" as const,
        mainDepartment,
        mainStorageName: undefined,
        mainStorageCode: undefined,
        qrLocation: undefined,
      };
    }

    return {
      scopeType: "storage" as const,
      mainDepartment,
      mainStorageName: selectedStorage.mainStorageName,
      mainStorageCode: selectedStorage.mainStorageCode,
      qrLocation: selectedQrLocation === "" ? null : selectedQrLocation,
    };
  }, [
    tab,
    mainDepartment,
    selectedStorage,
    selectedQrLocation,
    selectedToolkitId,
  ]);

  const {
    shadowboards,
    isLoading,
    error,
    canLoad,
    createShadowboard,
    updateShadowboard,
    deleteShadowboard,
  } = useShadowboards(shadowFilters as any);

  const currentShadowboard: Shadowboard | null = useMemo(
    () => shadowboards?.[0] || null,
    [shadowboards]
  );

  /* ----------------------------- */
  /* Included items                */
  /* ----------------------------- */

  const storageIncludedRows: SequenceRow[] = useMemo(() => {
    if (!selectedStorage || !mainDepartment) return [];

    const matchStorage = (o: any) =>
      o.mainDepartment === mainDepartment &&
      o.mainStorageName === selectedStorage.mainStorageName &&
      o.mainStorageCode === selectedStorage.mainStorageCode;

    const matchQr = (o: any) =>
      selectedQrLocation === "" ||
      String(o.qrLocation || "").toUpperCase() ===
        selectedQrLocation.toUpperCase();

    const toolRows: SequenceRow[] = (tools || [])
      .filter(matchStorage)
      .filter(matchQr)
      .map((t: any) => ({
        kind: "tool",
        id: t._id,
        label: t.name,
        eqNumber: t.eqNumber,
        location: t.qrLocation,
      }));

    const kitRows: SequenceRow[] = (toolkits || [])
      .filter(matchStorage)
      .filter(matchQr)
      .map((k: any) => ({
        kind: "toolkit",
        id: k._id,
        label: k.name,
        kitNumber: k.kitNumber,
        location: k.qrLocation,
      }));

    const all = [...toolRows, ...kitRows];
    all.sort((a: any, b: any) => {
      const ak = `${a.kind}:${a.label}`.toLowerCase();
      const bk = `${b.kind}:${b.label}`.toLowerCase();
      return ak.localeCompare(bk);
    });

    return all;
  }, [selectedStorage, mainDepartment, selectedQrLocation, tools, toolkits]);

  const toolkitIncludedRows: SequenceRow[] = useMemo(() => {
    if (!selectedToolkit) return [];
    const parentKitId = selectedToolkit._id;

    const rows: SequenceRow[] = (selectedToolkit.contents || []).map(
      (c: any) => ({
        kind: "kitContent",
        id: String(c._id),
        parentKitId,
        label: c.name,
        eqNumber: c.eqNumber,
        qty: c.qty,
      })
    );

    rows.sort((a: any, b: any) =>
      a.label.toLowerCase().localeCompare(b.label.toLowerCase())
    );
    return rows;
  }, [selectedToolkit]);

  const includedRows =
    tab === "toolkits" ? toolkitIncludedRows : storageIncludedRows;

  /* ----------------------------- */
  /* Apply saved sequence order    */
  /* ----------------------------- */

  const [orderedRows, setOrderedRows] = useState<SequenceRow[]>([]);

  useEffect(() => {
    const byKey = new Map<string, SequenceRow>();
    for (const r of includedRows) {
      const key =
        r.kind === "kitContent"
          ? `kitContent:${r.parentKitId}:${r.id}`
          : `${r.kind}:${r.id}`;
      byKey.set(key, r);
    }

    const seq = (currentShadowboard?.sequence || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const ordered: SequenceRow[] = [];

    for (const s of seq as any[]) {
      let key = "";
      if (s.itemType === "tool") key = `tool:${s.itemId}`;
      if (s.itemType === "toolkit") key = `toolkit:${s.itemId}`;
      if (s.itemType === "kitContent")
        key = `kitContent:${s.parentKitId}:${s.kitContentId}`;

      const found = byKey.get(key);
      if (found) {
        ordered.push(found);
        byKey.delete(key);
      }
    }

    ordered.push(...Array.from(byKey.values()));
    setOrderedRows(ordered);
  }, [includedRows, currentShadowboard]);

  /* ----------------------------- */
  /* Drag/drop                     */
  /* ----------------------------- */

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const onDragStart = (index: number) => () => setDragIndex(index);
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === toIndex) return;
    setOrderedRows((prev) => reorder(prev, dragIndex, toIndex));
    setDragIndex(null);
  };

  /* ----------------------------- */
  /* Images manager + workspace    */
  /* ----------------------------- */

  const [openImages, setOpenImages] = useState(false);
  const [imagesDraft, setImagesDraft] = useState<ShadowboardImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    const imgs = [...(currentShadowboard?.images || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    setImagesDraft(imgs);
    setActiveImageIndex((prev) =>
      imgs.length === 0 ? 0 : Math.min(prev, imgs.length - 1)
    );
  }, [currentShadowboard]);

  const totalImagesBytesApprox = useMemo(() => {
    return imagesDraft.reduce(
      (sum, img) => sum + approxBytesOfString(img.url || ""),
      0
    );
  }, [imagesDraft]);

  const addImageSlot = () => {
    if (imagesDraft.length >= MAX_IMAGES)
      return alert(`Max ${MAX_IMAGES} images per shadowboard.`);
    setImagesDraft((p) => [...p, { url: "", label: "", order: p.length }]);
  };

  const removeImage = (idx: number) => {
    setImagesDraft((p) => p.filter((_, i) => i !== idx));
    setActiveImageIndex((prev) => (prev > 0 ? Math.max(0, prev - 1) : 0));
  };

  const openFilePickerForIndex = (idx: number) => {
    setUploadTargetIndex(idx);
    fileInputRef.current?.click();
  };

  const imagesReady = useMemo(
    () => imagesDraft.filter((img) => String(img.url || "").trim().length > 0),
    [imagesDraft]
  );

  const activeImage = imagesReady[activeImageIndex] || imagesReady[0] || null;

  const handlePickedFile = async (file: File) => {
    if (uploadTargetIndex === null) return;

    try {
      const dataUrl = await fileToWebpDataUrl(file, {
        maxWidth: DEFAULT_MAX_WIDTH,
        quality: DEFAULT_WEBP_QUALITY,
      });

      const currentUrl = imagesDraft[uploadTargetIndex]?.url || "";
      const nextTotal =
        totalImagesBytesApprox -
        approxBytesOfString(currentUrl) +
        approxBytesOfString(dataUrl);

      if (nextTotal > MAX_TOTAL_DATAURL_BYTES_APPROX) {
        throw new Error(
          "Total images are too large for one shadowboard. Remove some images or use smaller photos."
        );
      }

      setImagesDraft((prev) =>
        prev.map((p, i) =>
          i === uploadTargetIndex ? { ...p, url: dataUrl } : p
        )
      );

      setActiveImageIndex(uploadTargetIndex);
    } catch (err: any) {
      alert(err?.message ?? "Failed to add image");
    } finally {
      setUploadTargetIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ----------------------------- */
  /* Lightbox (pro zoom)           */
  /* ----------------------------- */

  const [openLightbox, setOpenLightbox] = useState(false);

  // zoom + pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!openLightbox) return;
    resetZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openLightbox, activeImageIndex]);

  const lightboxPrev = () => {
    if (imagesReady.length <= 1) return;
    setActiveImageIndex(
      (i) => (i - 1 + imagesReady.length) % imagesReady.length
    );
  };

  const lightboxNext = () => {
    if (imagesReady.length <= 1) return;
    setActiveImageIndex((i) => (i + 1) % imagesReady.length);
  };

  /* ----------------------------- */
  /* Save / delete                 */
  /* ----------------------------- */

  const buildSequencePayload = (): ShadowboardSequenceItem[] => {
    return orderedRows.map((r, idx) => {
      if (r.kind === "tool") {
        return {
          itemType: "tool",
          itemId: r.id,
          itemModel: "Tool",
          order: idx,
        } as any;
      }
      if (r.kind === "toolkit") {
        return {
          itemType: "toolkit",
          itemId: r.id,
          itemModel: "ToolKit",
          order: idx,
        } as any;
      }
      return {
        itemType: "kitContent",
        parentKitId: r.parentKitId,
        kitContentId: r.id,
        order: idx,
      } as any;
    });
  };

  const canShowTable =
    tab === "toolkits"
      ? !!selectedToolkitId && !!mainDepartment
      : !!selectedStorageId && !!selectedStorage && !!mainDepartment;

  const saveShadowboard = async () => {
    if (!mainDepartment) return alert("Select a department first.");
    if (!canShowTable) return alert("Select a scope first.");

    try {
      const imagesNormalized = imagesDraft
        .map((img, idx) => ({
          url: String(img.url || "").trim(),
          label: String(img.label || "").trim(),
          order: idx,
        }))
        .filter((img) => !!img.url);

      const payload: Partial<Shadowboard> = {
        scopeType: tab === "toolkits" ? "toolkit" : "storage",
        images: imagesNormalized as any,
        sequence: buildSequencePayload() as any,
      };

      if (tab === "toolkits") {
        payload.toolkitId = selectedToolkitId;
      } else {
        payload.mainDepartment = mainDepartment;
        payload.mainStorageName = selectedStorage!.mainStorageName;
        payload.mainStorageCode = selectedStorage!.mainStorageCode;
        payload.qrLocation =
          selectedQrLocation === "" ? null : selectedQrLocation;
      }

      if (currentShadowboard?._id) {
        await updateShadowboard(currentShadowboard._id, payload as any);
      } else {
        await createShadowboard(payload as any);
      }

      setOpenImages(false);
    } catch (e: any) {
      alert(e?.message ?? "Failed to save shadowboard");
    }
  };

  const deleteCurrentShadowboard = async () => {
    if (!currentShadowboard?._id) return;
    if (!confirm("Delete this shadowboard?")) return;
    try {
      await deleteShadowboard(currentShadowboard._id);
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete shadowboard");
    }
  };

  /* ----------------------------- */
  /* UI                            */
  /* ----------------------------- */

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin-access/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <LayoutTemplate className="w-6 h-6" /> Manage Shadowboards
        </h1>
      </div>

      {/* Scope Tabs */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Scope</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
          <ToggleGroup
            type="single"
            value={tab}
            onValueChange={(v) => v && setTab(v as TabKey)}
            className="w-full md:w-auto"
          >
            <ToggleGroupItem value="storage">Main Storage</ToggleGroupItem>
            <ToggleGroupItem value="toolkits">Toolkits</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button
              variant="secondary"
              className="rounded-xl w-full sm:w-auto"
              onClick={() => setOpenImages(true)}
              disabled={!canShowTable}
              title={!canShowTable ? "Select a scope first" : undefined}
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Manage Images
            </Button>

            <Button
              className="rounded-xl w-full sm:w-auto"
              onClick={saveShadowboard}
              disabled={!canShowTable}
            >
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>

            <Button
              variant="destructive"
              className="rounded-xl w-full sm:w-auto"
              onClick={deleteCurrentShadowboard}
              disabled={!currentShadowboard?._id}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: selectors */}
        <Card className="rounded-2xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {tab === "toolkits" ? "Select Toolkit" : "Select Storage + Row"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {tab === "storage" ? (
              <>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Main Storage
                  </div>
                  <StrictCombobox
                    options={storageOptions}
                    valueId={selectedStorageId}
                    placeholder={
                      mainDepartment
                        ? "Select Main Storage"
                        : "Select a department first"
                    }
                    searchPlaceholder="Search storages…"
                    disabled={!mainDepartment}
                    onChange={(id) => {
                      setSelectedStorageId(id);
                      setSelectedQrLocation("");
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Row / Location (optional)
                  </div>
                  <StrictCombobox
                    options={qrLocationStrictOptions}
                    valueId={selectedQrLocation}
                    placeholder={
                      selectedStorageId
                        ? "Select row/location (optional)"
                        : "Select Main Storage first"
                    }
                    searchPlaceholder="Search rows/locations…"
                    disabled={!selectedStorageId}
                    allowClear
                    clearLabel="(Whole storage)"
                    onChange={(id) => setSelectedQrLocation(id)}
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  Sequences <b>Tools + Toolkits</b> for the selected scope.
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Toolkit</div>
                  <StrictCombobox
                    options={toolkitOptions}
                    valueId={selectedToolkitId}
                    placeholder={
                      mainDepartment
                        ? "Select Toolkit"
                        : "Select a department first"
                    }
                    searchPlaceholder="Search toolkits…"
                    disabled={!mainDepartment}
                    onChange={(id) => setSelectedToolkitId(id)}
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  Sequences the <b>Toolkit contents</b>.
                </div>
              </>
            )}

            <div className="pt-2 text-xs text-muted-foreground">
              Can load: <b>{String(canLoad)}</b> • Loading:{" "}
              <b>{String(isLoading)}</b>
              {error ? <span className="text-red-500"> • {error}</span> : null}
            </div>
          </CardContent>
        </Card>

        {/* Right: gallery + sequence */}
        <Card className="rounded-2xl lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Inline gallery (visible without clicking Preview) */}
            {canShowTable ? (
              <div className="rounded-2xl border p-3 md:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-muted-foreground">Images</span>
                    <span className="font-medium">{imagesReady.length}</span>
                    <span className="text-xs text-muted-foreground">
                      {imagesReady.length > 0
                        ? "Tap an image to zoom"
                        : "No images assigned"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="secondary"
                      className="rounded-xl w-full sm:w-auto"
                      onClick={() => setOpenImages(true)}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Manage Images
                    </Button>
                  </div>
                </div>

                {imagesReady.length > 0 ? (
                  <div
                    className="
                      flex gap-2 overflow-x-auto pb-1
                      sm:grid sm:overflow-visible sm:grid-cols-2
                      lg:grid-cols-3 xl:grid-cols-4
                    "
                  >
                    {imagesReady.map((img, idx) => (
                      <button
                        key={`${idx}-${img.url}`}
                        type="button"
                        className="
                          group relative shrink-0
                          w-44 sm:w-auto
                          rounded-2xl border bg-muted/20
                          overflow-hidden
                          focus:outline-none focus:ring-2 focus:ring-ring
                        "
                        onClick={() => {
                          setActiveImageIndex(idx);
                          setOpenLightbox(true);
                        }}
                        title={img.label || `Shadowboard image ${idx + 1}`}
                      >
                        <img
                          src={img.url}
                          alt={img.label || `Shadowboard image ${idx + 1}`}
                          className="
                            h-28 w-44 sm:w-full sm:h-36
                            object-cover
                            transition-transform duration-200
                            group-hover:scale-[1.03]
                          "
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[11px] px-2 py-1 flex items-center justify-between">
                          <span className="truncate max-w-[75%]">
                            {img.label || `Image ${idx + 1}`}
                          </span>
                          <span className="opacity-90">
                            {idx + 1}/{imagesReady.length}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Sequence table */}
            <div className="rounded-2xl border overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="text-sm font-medium">
                  Sequence (drag & drop)
                </div>
                <div className="text-xs text-muted-foreground">
                  Drag rows to match the shadowboard image layout.
                </div>
              </div>

              {!canShowTable ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Select a {tab === "toolkits" ? "Toolkit" : "Main Storage"} to
                  load items.
                </div>
              ) : orderedRows.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No items found for this scope.
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr className="text-left">
                        <th className="w-12 px-3 py-2"></th>
                        <th className="w-16 px-3 py-2">#</th>
                        <th className="px-3 py-2">Item</th>
                        <th className="w-40 px-3 py-2">EQ / Kit #</th>
                        <th className="w-40 px-3 py-2 hidden md:table-cell">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedRows.map((r, idx) => {
                        const key =
                          r.kind === "kitContent"
                            ? `kitContent:${r.parentKitId}:${r.id}`
                            : `${r.kind}:${r.id}`;

                        const rightCol =
                          r.kind === "tool"
                            ? nen(r.eqNumber)
                            : r.kind === "toolkit"
                            ? nen(r.kitNumber)
                            : nen(r.eqNumber);

                        const loc =
                          r.kind === "tool"
                            ? r.location || ""
                            : r.kind === "toolkit"
                            ? r.location || ""
                            : "";

                        const label =
                          r.kind === "tool"
                            ? `Tool — ${r.label}`
                            : r.kind === "toolkit"
                            ? `Toolkit — ${r.label}`
                            : `Kit Item — ${r.label}${
                                r.qty ? ` (x${r.qty})` : ""
                              }`;

                        return (
                          <tr
                            key={key}
                            className="border-b hover:bg-muted/40"
                            draggable
                            onDragStart={onDragStart(idx)}
                            onDragOver={onDragOver}
                            onDrop={onDrop(idx)}
                          >
                            <td className="px-3 py-2 text-muted-foreground">
                              <GripVertical className="w-4 h-4" />
                            </td>
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{label}</td>
                            <td className="px-3 py-2 font-medium">
                              {rightCol}
                            </td>
                            <td className="px-3 py-2 hidden md:table-cell">
                              {loc}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Images manager modal */}
      <Dialog open={openImages} onOpenChange={setOpenImages}>
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Manage Shadowboard Images</DialogTitle>
          </DialogHeader>

          {/* hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              handlePickedFile(f);
            }}
          />

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {imagesDraft.filter((i) => i.url).length} image(s) assigned •
                approx payload {Math.round(totalImagesBytesApprox / 1024)}KB
              </div>

              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={addImageSlot}
                disabled={imagesDraft.length >= MAX_IMAGES}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Image
              </Button>
            </div>

            {imagesDraft.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No image slots yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {imagesDraft.map((img, idx) => (
                  <div key={idx} className="rounded-2xl border p-3 space-y-3">
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={img.label || `Shadowboard image ${idx + 1}`}
                        className="w-full h-44 rounded-xl border object-cover bg-muted"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-44 rounded-xl border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                        No image selected
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-xl w-full sm:w-auto"
                        onClick={() => openFilePickerForIndex(idx)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {img.url ? "Replace" : "Upload"}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        className="rounded-xl w-full sm:w-auto"
                        onClick={() => removeImage(idx)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remove
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Label (optional)
                      </div>
                      <Input
                        value={img.label || ""}
                        onChange={(e) =>
                          setImagesDraft((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, label: e.target.value } : p
                            )
                          )
                        }
                        placeholder="e.g. Drawer 3 – left to right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Photos are compressed to <b>WEBP</b> and stored in MongoDB. Keep
              photos minimal for fast loading on tablets.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => setOpenImages(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Enlarge (zoom + pan) */}
      <Dialog open={openLightbox} onOpenChange={setOpenLightbox}>
        <DialogContent className="max-w-5xl rounded-2xl p-0 overflow-hidden">
          <div className="relative bg-black">
            <button
              type="button"
              onClick={() => setOpenLightbox(false)}
              className="absolute top-3 right-3 z-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white p-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {imagesReady.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={lightboxPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white p-2"
                  title="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  onClick={lightboxNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white p-2"
                  title="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            ) : null}

            <div
              className="relative w-full h-[85vh] overflow-hidden select-none touch-none"
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY;
                setZoom((z) => {
                  const next = clamp(z + (delta > 0 ? -0.15 : 0.15), 1, 4);
                  if (next === 1) setPan({ x: 0, y: 0 });
                  return next;
                });
              }}
              onPointerDown={(e) => {
                if (zoom <= 1) return;
                (e.currentTarget as any).setPointerCapture?.(e.pointerId);
                isPanningRef.current = true;
                panStartRef.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
              }}
              onPointerMove={(e) => {
                if (!isPanningRef.current) return;
                const dx = e.clientX - panStartRef.current.px;
                const dy = e.clientY - panStartRef.current.py;
                setPan({ x: panStartRef.current.x + dx, y: panStartRef.current.y + dy });
              }}
              onPointerUp={() => {
                isPanningRef.current = false;
              }}
              onPointerCancel={() => {
                isPanningRef.current = false;
              }}
              onDoubleClick={() => {
                setZoom((z) => {
                  const next = z === 1 ? 2.5 : 1;
                  if (next === 1) setPan({ x: 0, y: 0 });
                  return next;
                });
              }}
            >
              <img
                src={(imagesReady[activeImageIndex] || imagesReady[0])?.url}
                alt={
                  (imagesReady[activeImageIndex] || imagesReady[0])?.label ||
                  "Shadowboard image"
                }
                className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center",
                  transition: isPanningRef.current ? "none" : "transform 120ms ease-out",
                  cursor: zoom > 1 ? "grab" : "zoom-in",
                }}
                draggable={false}
              />

              {/* Zoom controls */}
              <div className="absolute left-3 bottom-3 z-10 flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white p-2"
                  title="Zoom out"
                  onClick={() => setZoom((z) => clamp(z - 0.25, 1, 4))}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white p-2"
                  title="Zoom in"
                  onClick={() => setZoom((z) => clamp(z + 0.25, 1, 4))}
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white p-2"
                  title="Reset"
                  onClick={resetZoom}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <div className="text-white/80 text-xs px-2">
                  {Math.round(zoom * 100)}%
                </div>
              </div>

              <div className="absolute right-3 bottom-3 z-10 text-white/70 text-[11px] bg-black/30 rounded-xl px-3 py-2">
                Tip: wheel / +/- to zoom • drag to pan • double-click to toggle zoom
              </div>
            </div>

            <div className="px-4 py-3 text-white/80 text-xs bg-black/60">
              {activeImage?.label ? `Label: ${activeImage.label}` : "No label"}
              {imagesReady.length > 1
                ? ` • ${activeImageIndex + 1}/${imagesReady.length}`
                : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}