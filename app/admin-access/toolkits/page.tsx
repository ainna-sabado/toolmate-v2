"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDepartment } from "@/context/DepartmentContext";
import { useRouter } from "next/navigation";

import { useToolKits } from "@/hooks/useToolKits";
import { useStorage } from "@/hooks/useStorage";
import { useToolMeta } from "@/hooks/useToolMeta";
import {
  isAnyKitContentDue,
  getEffectiveStatus,
} from "@/lib/helpers/calibration";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { ArrowLeft, ChevronDown, ChevronUp, Pen, Trash2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { StatusBadge } from "@/components/helpers/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type KitContentItem = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  eqNumber?: string;
  qty: number;
  calDate?: string | null;
  auditStatus: string;
};

type ToolKitRow = {
  _id: string;
  name: string;
  kitNumber: string;
  mainStorageName?: string;
  mainStorageCode?: string;
  qrLocation: string;
  storageType?: string;
  status: string;
  auditStatus: string;
  contents: KitContentItem[];
  dueDate?: string | Date | null; // toolkit-level calibration due date (optional)
};

const TOOLKIT_STATUS_OPTIONS = [
  "available",
  "in use",
  "for calibration",
  "damaged",
  "lost",
  "maintenance",
  "expired",
];

const PAGE_SIZE = 10;

function toLabel(value?: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Format date for display as "DD MMM YY"
function formatDateForDisplay(value?: string | Date | null): string {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" }); // Jan, Feb, ...
  const year = d.toLocaleString("en-GB", { year: "2-digit" }); // 25

  return `${day} ${month} ${year}`; // 01 Jan 25
}

// Format date for <input type="date" /> as "YYYY-MM-DD"
function formatDateForInput(value?: string | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function ToolKitsPage() {
  const router = useRouter();
  const { mainDepartment } = useDepartment();

  const {
    kits,
    storageLocations,
    loading,
    error: kitsError,
    refresh: refreshKits,
    updateToolkit,
    deleteToolkit,
    // NOTE: we keep addKitContent in the hook, but we DON'T use it here
    updateKitContent: updateKitContentAPI,
    deleteKitContent: deleteKitContentAPI,
  } = useToolKits(mainDepartment);

  const { storages, qrLocations, loadQrLocations } = useStorage(mainDepartment);
  const { brands, categories } = useToolMeta();

  // Toolkit form (ADD)
  const [form, setForm] = useState({
    name: "",
    kitNumber: "",
    brand: "",
    category: "",
    qrCode: "",
    mainStorageName: "",
    mainStorageCode: "",
    qrLocation: "",
    storageType: "",
    status: "available",
    dueDate: "", // YYYY-MM-DD for toolkit cal due (optional)
  });

  // Content form (ADD)
  const [contentForm, setContentForm] = useState({
    name: "",
    brand: "",
    category: "",
    eqNumber: "",
    qty: "1",
    calDate: "",
  });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contentSuccess, setContentSuccess] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  // Filters + pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storageFilter, setStorageFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const storageNameOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (storageLocations || [])
            .map((s: any) => s.mainStorageName as string)
            .filter(Boolean)
        )
      ),
    [storageLocations]
  );

  const filteredKits: ToolKitRow[] = useMemo(() => {
    const base: ToolKitRow[] = Array.isArray(kits)
      ? (kits as ToolKitRow[])
      : [];
    let result = [...base];

    if (storageFilter !== "all" && storageFilter) {
      result = result.filter((kit) => kit.mainStorageName === storageFilter);
    }

    if (statusFilter !== "all" && statusFilter) {
      result = result.filter((kit) => {
        const effectiveStatus = isAnyKitContentDue(kit.contents)
          ? "for calibration"
          : getEffectiveStatus(kit.status, kit.dueDate ?? null);
        return effectiveStatus === statusFilter;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((kit) => {
        return (
          kit.name?.toLowerCase().includes(term) ||
          kit.kitNumber?.toLowerCase().includes(term) ||
          kit.qrLocation?.toLowerCase().includes(term) ||
          kit.mainStorageName?.toLowerCase().includes(term)
        );
      });
    }

    // Safe sort in case any record is missing name
    result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return result;
  }, [kits, storageFilter, statusFilter, searchTerm]);

  const totalKits = filteredKits.length;
  const totalPages = Math.max(1, Math.ceil(totalKits / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paginatedKits = filteredKits.slice(pageStart, pageEnd);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, storageFilter]);

  // Toolkit form change
  const handleToolkitFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "kitNumber") {
      setForm((prev) => ({
        ...prev,
        kitNumber: value,
        qrCode: value ? `QR-${value}` : "",
      }));
      return;
    }

    if (name === "mainStorageName") {
      const selected = (storages || []).find(
        (s: any) => s.mainStorageName === value
      );

      setForm((prev) => ({
        ...prev,
        mainStorageName: value,
        mainStorageCode: selected?.mainStorageCode || "",
        storageType: selected?.storageType || "",
      }));

      loadQrLocations(value);
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  // Create toolkit (POST /api/toolkits)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainDepartment) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        kitNumber: form.kitNumber.trim(),
        brand: form.brand.trim() || undefined,
        category: form.category.trim() || undefined,
        qrCode: form.qrCode.trim(),
        mainDepartment,
        mainStorageName: form.mainStorageName,
        mainStorageCode: form.mainStorageCode,
        qrLocation: form.qrLocation.trim(),
        storageType: form.storageType,
        status: form.status || "available",
      };

      // optional toolkit calibration due date
      if (form.dueDate) {
        payload.dueDate = form.dueDate;
      }

      const res = await fetch("/api/toolkits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save toolkit.");

      setSuccess("Toolkit saved successfully!");
      setForm({
        name: "",
        kitNumber: "",
        brand: "",
        category: "",
        qrCode: "",
        mainStorageName: "",
        mainStorageCode: "",
        qrLocation: "",
        storageType: "",
        status: "available",
        dueDate: "",
      });

      refreshKits();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ADD Kit Content – direct POST to contents endpoint
  const handleAddKitContent = async (kitId: string) => {
    setContentLoading(true);
    setContentError(null);
    setContentSuccess(null);

    try {
      const payload = {
        name: contentForm.name.trim(),
        brand: contentForm.brand.trim() || undefined,
        category: contentForm.category.trim() || undefined,
        eqNumber: contentForm.eqNumber.trim(),
        qty: Number(contentForm.qty) || 1,
        calDate: contentForm.calDate || null,
        auditStatus: "pending",
      };

      const res = await fetch(`/api/toolkits/${kitId}/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add kit item.");

      // Reload from API so contents (with _id) are fresh
      await refreshKits();

      setContentForm({
        name: "",
        brand: "",
        category: "",
        eqNumber: "",
        qty: "1",
        calDate: "",
      });

      setContentSuccess("Item added successfully!");
      setTimeout(() => setContentSuccess(null), 3000);
    } catch (err: any) {
      setContentError(err.message || "Something went wrong.");
    } finally {
      setContentLoading(false);
    }
  };

  // ---------------------------
  // EDIT TOOLKIT state
  // ---------------------------
  const [editingKit, setEditingKit] = useState<ToolKitRow | null>(null);
  const [editKitSaving, setEditKitSaving] = useState(false);
  const [editKitForm, setEditKitForm] = useState({
    name: "",
    kitNumber: "",
    brand: "",
    category: "",
    status: "available",
    dueDate: "", // YYYY-MM-DD
  });

  const openEditKit = (kit: ToolKitRow) => {
    setEditingKit(kit);
    setEditKitForm({
      name: kit.name || "",
      kitNumber: kit.kitNumber || "",
      brand: (kit as any).brand || "",
      category: (kit as any).category || "",
      status: kit.status || "available",
      dueDate: formatDateForInput(kit.dueDate ?? null),
    });
  };

  const handleEditKitChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditKitForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditKitSave = async () => {
    if (!editingKit) return;

    setEditKitSaving(true);
    try {
      const payload: any = {
        name: editKitForm.name.trim(),
        kitNumber: editKitForm.kitNumber.trim(),
        brand: editKitForm.brand.trim() || undefined,
        category: editKitForm.category.trim() || undefined,
        status: editKitForm.status,
        dueDate: editKitForm.dueDate || null,
      };

      await updateToolkit(editingKit._id, payload);
      setEditingKit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditKitSaving(false);
    }
  };

  const closeEditKit = () => {
    if (editKitSaving) return;
    setEditingKit(null);
  };

  const handleDeleteKit = async (kit: ToolKitRow) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete toolkit "${kit.name}"?\n\nThis will delete the toolkit including all kit contents.`
    );
    if (!confirmDelete) return;

    try {
      await deleteToolkit(kit._id);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------
  // EDIT KIT CONTENT state
  // ---------------------------
  const [editingContentKitId, setEditingContentKitId] = useState<string | null>(
    null
  );
  const [editingContent, setEditingContent] = useState<KitContentItem | null>(
    null
  );
  const [editContentSaving, setEditContentSaving] = useState(false);
  const [editContentForm, setEditContentForm] = useState({
    name: "",
    brand: "",
    category: "",
    eqNumber: "",
    qty: "1",
    calDate: "",
  });

  const openEditContent = (kitId: string, item: KitContentItem) => {
    setEditingContentKitId(kitId);
    setEditingContent(item);
    setEditContentForm({
      name: item.name || "",
      brand: item.brand || "",
      category: item.category || "",
      eqNumber: item.eqNumber || "",
      qty: String(item.qty ?? 1),
      calDate: item.calDate ? item.calDate.substring(0, 10) : "",
    });
  };

  const handleEditContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditContentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditContentSave = async () => {
    if (!editingContentKitId || !editingContent) return;

    setEditContentSaving(true);
    try {
      const payload = {
        name: editContentForm.name.trim(),
        brand: editContentForm.brand.trim() || undefined,
        category: editContentForm.category.trim() || undefined,
        eqNumber: editContentForm.eqNumber.trim() || undefined,
        qty: Number(editContentForm.qty) || 1,
        calDate: editContentForm.calDate || null,
      };

      await updateKitContentAPI(
        editingContentKitId,
        editingContent._id,
        payload
      );
      setEditingContent(null);
      setEditingContentKitId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditContentSaving(false);
    }
  };

  const closeEditContent = () => {
    if (editContentSaving) return;
    setEditingContent(null);
    setEditingContentKitId(null);
  };

  const handleDeleteContent = async (kitId: string, item: KitContentItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${item.name}" from this toolkit?`
    );
    if (!confirmDelete) return;

    try {
      await deleteKitContentAPI(kitId, item._id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <Button
          variant="ghost"
          onClick={() => router.push("/admin-access/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      {/* Add Toolkit */}
      <Card>
        <CardHeader>
          <CardTitle>Add Toolkit ({mainDepartment})</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm mb-1 block">Name *</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleToolkitFormChange}
                required
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Kit Number *</label>
              <Input
                name="kitNumber"
                value={form.kitNumber}
                onChange={handleToolkitFormChange}
                required
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">QR Code</label>
              <Input
                name="qrCode"
                value={form.qrCode}
                readOnly
                className="bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Brand</label>
              <Combobox
                value={form.brand}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, brand: v }))
                }
                options={brands}
                placeholder="Select or type..."
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Category</label>
              <Combobox
                value={form.category}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, category: v }))
                }
                options={categories}
                placeholder="Select or type..."
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">
                Calibration Due Date{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <Input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleToolkitFormChange}
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Main Storage *</label>
              <select
                name="mainStorageName"
                value={form.mainStorageName}
                onChange={handleToolkitFormChange}
                required
                className="border rounded-md px-3 py-2 w-full text-sm"
              >
                <option value="">Select Storage</option>
                {(storages || []).map((s: any) => (
                  <option key={s.mainStorageName} value={s.mainStorageName}>
                    {s.mainStorageName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm mb-1 block">Storage Code</label>
              <Input
                name="mainStorageCode"
                value={form.mainStorageCode}
                readOnly
                className="bg-gray-100 text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">QR Location</label>
              <select
                name="qrLocation"
                value={form.qrLocation}
                onChange={handleToolkitFormChange}
                className="border rounded-md px-3 py-2 w-full text-sm"
              >
                <option value="">Select QR Location</option>
                {qrLocations.map((loc) => (
                  <option key={loc._id} value={loc.qrCode}>
                    {loc.rowName} ({loc.qrCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm mb-1 block">Storage Type *</label>
              <Input
                name="storageType"
                value={form.storageType}
                readOnly
                className="bg-gray-100 text-gray-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-4">
              <Button disabled={submitting}>
                {submitting ? "Saving..." : "Save Toolkit"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Toolkits table */}
      <Card>
        <CardHeader>
          <CardTitle>Toolkits — {mainDepartment}</CardTitle>
        </CardHeader>

        <CardContent>
          {kitsError && (
            <p className="text-red-500 text-sm mb-2">{kitsError}</p>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : (kits || []).length === 0 ? (
            <p>No toolkits found.</p>
          ) : (
            <>
              {/* Filters */}
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 gap-2">
                  <Input
                    placeholder="Search by name, kit #, QR, storage..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />

                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={storageFilter}
                    onChange={(e) => setStorageFilter(e.target.value)}
                  >
                    <option value="all">All storages</option>
                    {storageNameOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {TOOLKIT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {toLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredKits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No toolkits match your search and filters.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Kit #</TableHead>
                        <TableHead>Main Storage</TableHead>
                        <TableHead>QR Location</TableHead>
                        <TableHead>Cal Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginatedKits.map((kit) => {
                        const isOpen = expanded === kit._id;

                        let effectiveStatus = getEffectiveStatus(
                          kit.status,
                          kit.dueDate ?? null
                        );

                        if (isAnyKitContentDue(kit.contents)) {
                          effectiveStatus = "for calibration";
                        }

                        return (
                          <React.Fragment key={kit._id}>
                            <TableRow>
                              <TableCell>{kit.name}</TableCell>
                              <TableCell>{kit.kitNumber}</TableCell>
                              <TableCell>
                                {kit.mainStorageName || "-"}
                              </TableCell>
                              <TableCell>{kit.qrLocation || "-"}</TableCell>
                              <TableCell>
                                {formatDateForDisplay(kit.dueDate ?? null)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  kind="status"
                                  value={effectiveStatus}
                                />
                              </TableCell>
                              <TableCell className="space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 p-1"
                                  onClick={() => openEditKit(kit)}
                                  aria-label="Edit toolkit"
                                >
                                  <Pen className="h-3 w-3" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 p-1 text-red-600"
                                  onClick={() => handleDeleteKit(kit)}
                                  aria-label="Delete toolkit"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 p-1"
                                  onClick={() => toggleExpand(kit._id)}
                                  aria-label={
                                    isOpen
                                      ? "Collapse contents"
                                      : "Expand contents"
                                  }
                                >
                                  {isOpen ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {isOpen && (
                              <TableRow>
                                <TableCell colSpan={7}>
                                  <div className="bg-muted/40 p-4 rounded-md">
                                    <h4 className="font-semibold mb-3">
                                      Kit Contents
                                    </h4>

                                    {/* Contents list */}
                                    {kit.contents.length === 0 ? (
                                      <p className="text-sm text-muted-foreground mb-4">
                                        No contents added yet.
                                      </p>
                                    ) : (
                                      <Table className="border mb-6">
                                        <TableHeader>
                                          <TableRow className="bg-muted">
                                            <TableHead>Name</TableHead>
                                            <TableHead>Brand</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Eq #</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Cal</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                          {kit.contents.map(
                                            (item: KitContentItem, idx) => (
                                              <TableRow
                                                key={
                                                  item._id ||
                                                  `${kit._id}-content-${idx}`
                                                }
                                              >
                                                <TableCell>
                                                  {item.name}
                                                </TableCell>
                                                <TableCell>
                                                  {item.brand || "-"}
                                                </TableCell>
                                                <TableCell>
                                                  {item.category || "-"}
                                                </TableCell>
                                                <TableCell>
                                                  {item.eqNumber || "-"}
                                                </TableCell>
                                                <TableCell>
                                                  {item.qty}
                                                </TableCell>
                                                <TableCell>
                                                  {item.calDate
                                                    ? formatDateForDisplay(
                                                        item.calDate
                                                      )
                                                    : "N/A"}
                                                </TableCell>
                                                <TableCell className="space-x-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 p-1"
                                                    onClick={() =>
                                                      openEditContent(
                                                        kit._id,
                                                        item
                                                      )
                                                    }
                                                    aria-label="Edit kit item"
                                                  >
                                                    <Pen className="h-3 w-3" />
                                                  </Button>

                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 p-1 text-red-600"
                                                    onClick={() =>
                                                      handleDeleteContent(
                                                        kit._id,
                                                        item
                                                      )
                                                    }
                                                    aria-label="Delete kit item"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    )}

                                    {/* Content feedback */}
                                    {contentSuccess && (
                                      <p className="text-green-600 text-sm mb-2">
                                        {contentSuccess}
                                      </p>
                                    )}
                                    {contentError && (
                                      <p className="text-red-500 text-sm mb-2">
                                        {contentError}
                                      </p>
                                    )}

                                    {/* Add content */}
                                    <h4 className="font-semibold mb-2">
                                      Add New Content
                                    </h4>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      <Input
                                        name="name"
                                        value={contentForm.name}
                                        onChange={(e) =>
                                          setContentForm((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                          }))
                                        }
                                        placeholder="Name *"
                                      />
                                      <Input
                                        name="brand"
                                        value={contentForm.brand}
                                        onChange={(e) =>
                                          setContentForm((prev) => ({
                                            ...prev,
                                            brand: e.target.value,
                                          }))
                                        }
                                        placeholder="Brand"
                                      />
                                      <Input
                                        name="category"
                                        value={contentForm.category}
                                        onChange={(e) =>
                                          setContentForm((prev) => ({
                                            ...prev,
                                            category: e.target.value,
                                          }))
                                        }
                                        placeholder="Category"
                                      />
                                      <Input
                                        name="eqNumber"
                                        value={contentForm.eqNumber}
                                        onChange={(e) =>
                                          setContentForm((prev) => ({
                                            ...prev,
                                            eqNumber: e.target.value,
                                          }))
                                        }
                                        placeholder="Eq Number"
                                      />
                                      <Input
                                        name="qty"
                                        type="number"
                                        min="1"
                                        value={contentForm.qty}
                                        onChange={(e) =>
                                          setContentForm((prev) => ({
                                            ...prev,
                                            qty: e.target.value,
                                          }))
                                        }
                                        placeholder="Qty"
                                      />
                                      <Input
                                        name="calDate"
                                        type="date"
                                        value={contentForm.calDate}
                                        onChange={(e) =>
                                          setContentForm((prev) => ({
                                            ...prev,
                                            calDate: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>

                                    <Button
                                      className="mt-4"
                                      onClick={() =>
                                        handleAddKitContent(kit._id)
                                      }
                                      disabled={contentLoading}
                                    >
                                      {contentLoading
                                        ? "Adding..."
                                        : "Add Item"}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      Showing {totalKits === 0 ? 0 : pageStart + 1}–
                      {Math.min(pageEnd, totalKits)} of {totalKits} toolkits
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Toolkit Dialog */}
      <Dialog
        open={!!editingKit}
        onOpenChange={(open) => !open && closeEditKit()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Toolkit</DialogTitle>
          </DialogHeader>

          {editingKit && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm mb-1 block">Name *</label>
                <Input
                  name="name"
                  value={editKitForm.name}
                  onChange={handleEditKitChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm mb-1 block">Kit Number *</label>
                  <Input
                    name="kitNumber"
                    value={editKitForm.kitNumber}
                    onChange={handleEditKitChange}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Brand</label>
                  <Combobox
                    value={editKitForm.brand}
                    onValueChange={(v) =>
                      setEditKitForm((prev) => ({ ...prev, brand: v }))
                    }
                    options={brands}
                    placeholder="Select or type..."
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Category</label>
                  <Combobox
                    value={editKitForm.category}
                    onValueChange={(v) =>
                      setEditKitForm((prev) => ({ ...prev, category: v }))
                    }
                    options={categories}
                    placeholder="Select or type..."
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">
                    Calibration Due Date
                    <span className="text-xs text-muted-foreground ml-1">
                      (optional)
                    </span>
                  </label>
                  <Input
                    name="dueDate"
                    type="date"
                    value={editKitForm.dueDate}
                    onChange={handleEditKitChange}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={closeEditKit}
              disabled={editKitSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditKitSave} disabled={editKitSaving}>
              {editKitSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Kit Content Dialog */}
      <Dialog
        open={!!editingContent}
        onOpenChange={(open) => !open && closeEditContent()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kit Item</DialogTitle>
          </DialogHeader>

          {editingContent && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm mb-1 block">Name *</label>
                <Input
                  name="name"
                  value={editContentForm.name}
                  onChange={handleEditContentChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm mb-1 block">Brand</label>
                  <Input
                    name="brand"
                    value={editContentForm.brand}
                    onChange={handleEditContentChange}
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Category</label>
                  <Input
                    name="category"
                    value={editContentForm.category}
                    onChange={handleEditContentChange}
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Eq Number</label>
                  <Input
                    name="eqNumber"
                    value={editContentForm.eqNumber}
                    onChange={handleEditContentChange}
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Qty</label>
                  <Input
                    name="qty"
                    type="number"
                    min="1"
                    value={editContentForm.qty}
                    onChange={handleEditContentChange}
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Cal Date</label>
                  <Input
                    name="calDate"
                    type="date"
                    value={editContentForm.calDate}
                    onChange={handleEditContentChange}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={closeEditContent}
              disabled={editContentSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditContentSave}
              disabled={editContentSaving}
            >
              {editContentSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
