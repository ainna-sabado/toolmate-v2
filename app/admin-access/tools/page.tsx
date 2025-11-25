"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDepartment } from "@/context/DepartmentContext";

import { useTools } from "@/hooks/useTools";
import { useStorage } from "@/hooks/useStorage";
import { useToolMeta } from "@/hooks/useToolMeta";

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

import { Combobox } from "@/components/ui/combobox";
import { StatusBadge } from "@/components/helpers/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import toast from "react-hot-toast";

type ToolRow = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  eqNumber?: string;
  qty?: number;
  mainStorageName?: string;
  mainStorageCode?: string;
  qrLocation?: string;
  storageType?: string;
  status?: string;
  auditStatus?: string; // still exists, just not shown/filtered
};

const TOOL_STATUS_OPTIONS = [
  "available",
  "in use",
  "for calibration",
  "damaged",
  "lost",
  "maintenance",
  "expired",
];

const PAGE_SIZE = 15;

function toLabel(value?: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ToolsPage() {
  const { mainDepartment } = useDepartment();

  const {
    tools,
    loading,
    error: toolsError,
    refresh: refreshTools,
    updateTool,
    deleteTool,
  } = useTools(mainDepartment);

  const { storages, qrLocations, loadQrLocations } = useStorage(mainDepartment);
  const { brands, categories } = useToolMeta();

  // Filters + pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storageFilter, setStorageFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const storageNameOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (storages || [])
            .map((s: any) => s.mainStorageName as string)
            .filter(Boolean)
        )
      ),
    [storages]
  );

  const filteredTools: ToolRow[] = useMemo(() => {
    const base: ToolRow[] = Array.isArray(tools) ? (tools as ToolRow[]) : [];
    let result = [...base];

    if (storageFilter !== "all" && storageFilter) {
      result = result.filter((tool) => tool.mainStorageName === storageFilter);
    }

    if (statusFilter !== "all" && statusFilter) {
      result = result.filter(
        (tool) => (tool.status || "available") === statusFilter
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((tool) => {
        return (
          tool.name?.toLowerCase().includes(term) ||
          tool.eqNumber?.toLowerCase().includes(term) ||
          tool.brand?.toLowerCase().includes(term) ||
          tool.category?.toLowerCase().includes(term) ||
          tool.qrLocation?.toLowerCase().includes(term) ||
          tool.mainStorageName?.toLowerCase().includes(term)
        );
      });
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [tools, storageFilter, statusFilter, searchTerm]);

  const totalTools = filteredTools.length;
  const totalPages = Math.max(1, Math.ceil(totalTools / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paginatedTools = filteredTools.slice(pageStart, pageEnd);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, storageFilter]);

  // Surface load error as toast as well
  useEffect(() => {
    if (toolsError) {
      toast.error(toolsError);
    }
  }, [toolsError]);

  // ---------------------------
  // Add Tool form state
  // ---------------------------
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "",
    eqNumber: "",
    qty: "1",
    mainStorageName: "",
    mainStorageCode: "",
    qrLocation: "",
    storageType: "",
  });

  // Keep storageCode + type in sync for ADD form
  useEffect(() => {
    if (!form.mainStorageName) {
      setForm((prev) => ({
        ...prev,
        mainStorageCode: "",
        storageType: "",
      }));
      return;
    }

    const selected = (storages || []).find(
      (s: any) => s.mainStorageName === form.mainStorageName
    );

    setForm((prev) => ({
      ...prev,
      mainStorageCode: selected?.mainStorageCode || "",
      storageType: selected?.storageType || "",
    }));

    loadQrLocations(form.mainStorageName);
  }, [form.mainStorageName, storages, loadQrLocations]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainDepartment) return;

    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        category: form.category.trim() || undefined,
        eqNumber: form.eqNumber.trim() || undefined,
        qty: Number(form.qty) || 1,
        mainDepartment,
        mainStorageName: form.mainStorageName,
        mainStorageCode: form.mainStorageCode,
        qrLocation: form.qrLocation.trim(),
        storageType: form.storageType,
      };

      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save tool.");

      setSuccess("Tool saved successfully!");
      toast.success("Tool added successfully.");

      setForm({
        name: "",
        brand: "",
        category: "",
        eqNumber: "",
        qty: "1",
        mainStorageName: "",
        mainStorageCode: "",
        qrLocation: "",
        storageType: "",
      });

      refreshTools();
    } catch (err: any) {
      const msg = err.message || "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------
  // EDIT TOOL state
  // ---------------------------
  const [editingTool, setEditingTool] = useState<ToolRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    category: "",
    eqNumber: "",
    qty: "1",
    status: "available", // still used in update, just not editable here
  });

  const openEdit = (tool: ToolRow) => {
    setEditingTool(tool);
    setEditForm({
      name: tool.name || "",
      brand: tool.brand || "",
      category: tool.category || "",
      eqNumber: tool.eqNumber || "",
      qty: String(tool.qty ?? 1),
      status: tool.status || "available",
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    if (!editingTool) return;

    setEditSaving(true);
    try {
      await updateTool(editingTool._id, {
        name: editForm.name.trim(),
        brand: editForm.brand.trim() || undefined,
        category: editForm.category.trim() || undefined,
        eqNumber: editForm.eqNumber.trim() || undefined,
        qty: Number(editForm.qty) || 1,
        // status is NOT changed from here anymore
      });

      toast.success("Tool updated successfully.");
      setEditingTool(null);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to update tool";
      toast.error(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const closeEdit = () => {
    if (editSaving) return;
    setEditingTool(null);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* Add Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Add Tool ({mainDepartment})</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm mb-1 block">Name *</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
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
              <label className="text-sm mb-1 block">Eq Number</label>
              <Input
                name="eqNumber"
                value={form.eqNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Qty</label>
              <Input
                name="qty"
                type="number"
                min="1"
                value={form.qty}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Main Storage *</label>
              <select
                name="mainStorageName"
                value={form.mainStorageName}
                onChange={handleChange}
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
              <label className="text-sm mb-1 block">QR Location *</label>
              <select
                name="qrLocation"
                value={form.qrLocation}
                onChange={handleChange}
                required
                className="border rounded-md px-3 py-2 w-full text-sm"
              >
                <option value="">Select QR Location</option>
                {qrLocations.map((qr: string) => (
                  <option key={qr} value={qr}>
                    {qr}
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

            <div className="md:col-span-2 flex gap-4 items-center">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Tool"}
              </Button>

              {success && <p className="text-green-600 text-sm">{success}</p>}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tools — {mainDepartment}</CardTitle>
        </CardHeader>

        <CardContent>
          {toolsError && (
            <p className="text-red-500 text-sm mb-2">
              {toolsError}
            </p>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : (tools || []).length === 0 ? (
            <p>No tools found for this department.</p>
          ) : (
            <>
              {/* Filters */}
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 gap-2">
                  <Input
                    placeholder="Search by name, Eq #, brand, category, QR..."
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
                    {TOOL_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {toLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredTools.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tools match your search and filters.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Eq #</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Main Storage</TableHead>
                          <TableHead>QR Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {paginatedTools.map((tool) => (
                          <TableRow key={tool._id}>
                            <TableCell>{tool.name}</TableCell>
                            <TableCell>{tool.brand || "-"}</TableCell>
                            <TableCell>{tool.category || "-"}</TableCell>
                            <TableCell>{tool.eqNumber || "-"}</TableCell>
                            <TableCell>{tool.qty ?? 1}</TableCell>
                            <TableCell>{tool.mainStorageName || "-"}</TableCell>
                            <TableCell>{tool.qrLocation || "-"}</TableCell>
                            <TableCell>
                              <StatusBadge
                                kind="status"
                                value={tool.status || "available"}
                              />
                            </TableCell>
                            <TableCell className="space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(tool)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={async () => {
                                  const confirmDelete = window.confirm(
                                    `Delete tool "${tool.name}"?`
                                  );
                                  if (!confirmDelete) return;

                                  try {
                                    await deleteTool(tool._id);
                                    toast.success("Tool deleted.");
                                  } catch (err: any) {
                                    console.error(err);
                                    const msg =
                                      err.message || "Failed to delete tool";
                                    toast.error(msg);
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      Showing {totalTools === 0 ? 0 : pageStart + 1}–
                      {Math.min(pageEnd, totalTools)} of {totalTools} tools
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

      {/* Edit Tool Dialog */}
      <Dialog
        open={!!editingTool}
        onOpenChange={(open) => !open && closeEdit()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
          </DialogHeader>

          {editingTool && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm mb-1 block">Name *</label>
                <Input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm mb-1 block">Brand</label>
                  <Combobox
                    value={editForm.brand}
                    onValueChange={(v) =>
                      setEditForm((prev) => ({ ...prev, brand: v }))
                    }
                    options={brands}
                    placeholder="Select or type..."
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Category</label>
                  <Combobox
                    value={editForm.category}
                    onValueChange={(v) =>
                      setEditForm((prev) => ({ ...prev, category: v }))
                    }
                    options={categories}
                    placeholder="Select or type..."
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Eq Number</label>
                  <Input
                    name="eqNumber"
                    value={editForm.eqNumber}
                    onChange={handleEditChange}
                  />
                </div>

                <div>
                  <label className="text-sm mb-1 block">Qty</label>
                  <Input
                    name="qty"
                    type="number"
                    min="1"
                    value={editForm.qty}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeEdit} disabled={editSaving}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
