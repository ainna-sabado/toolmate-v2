"use client";

import React, { useEffect, useState } from "react";
import { useDepartment } from "@/context/DepartmentContext";

import { useToolKits } from "@/hooks/useToolKits";
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

import { ChevronDown, ChevronUp } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

export default function ToolKitsPage() {
  const { mainDepartment } = useDepartment();

  const {
    kits,
    storageLocations,
    loading,
    refresh: refreshKits,
  } = useToolKits(mainDepartment);

  const { storages, qrLocations, loadQrLocations } = useStorage(mainDepartment);
  const { brands, categories } = useToolMeta();

  // Toolkit form
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
  });

  // Add content form
  const [contentForm, setContentForm] = useState({
    name: "",
    brand: "",
    category: "",
    eqNumber: "",
    qty: "1",
    calDate: "",
  });

  // Page state
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Content-specific feedback
  const [contentSuccess, setContentSuccess] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  // Auto-generate QR from kit number
  const handleToolkitFormChange = (e: any) => {
    const { name, value } = e.target;

    if (name === "kitNumber") {
      setForm((prev) => ({
        ...prev,
        kitNumber: value,
        qrCode: value ? `QR-${value}` : "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-fill storage fields + load QR options
  useEffect(() => {
    const selected = storages.find(
      (s) => s.mainStorageName === form.mainStorageName
    );

    setForm((prev) => ({
      ...prev,
      mainStorageCode: selected?.mainStorageCode || "",
      storageType: selected?.storageType || "",
    }));

    loadQrLocations(form.mainStorageName);
  }, [form.mainStorageName, storages, loadQrLocations]);

  // Create toolkit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        kitNumber: form.kitNumber.trim(),
        qrCode: form.qrCode.trim(),
        mainDepartment,
        mainStorageName: form.mainStorageName,
        mainStorageCode: form.mainStorageCode,
        qrLocation: form.qrLocation,
        storageType: form.storageType,
        status: form.status,
      };

      if (form.brand.trim()) payload.brand = form.brand.trim();
      if (form.category.trim()) payload.category = form.category.trim();

      const res = await fetch("/api/toolkits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Toolkit created successfully.");
      refreshKits();

      // Reset form
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
      });

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  // Add content to toolkit
  const addKitContent = async (kitId: string) => {
    setContentLoading(true);
    setContentSuccess(null);
    setContentError(null);

    try {
      const payload = {
        name: contentForm.name.trim(),
        brand: contentForm.brand.trim(),
        category: contentForm.category.trim(),
        eqNumber: contentForm.eqNumber.trim(),
        qty: Number(contentForm.qty),
        calDate: contentForm.calDate || null,
        auditStatus: "pending",
      };

      const res = await fetch(`/api/toolkits/${kitId}/contents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      refreshKits();

      // Reset content form
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
      setContentError(err.message);
      setTimeout(() => setContentError(null), 4000);
    } finally {
      setContentLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  if (!mainDepartment) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg font-semibold">No Department Selected</p>
        <p>Please choose a department from Settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* -------------------------------------------------- */}
      {/* ADD TOOLKIT FORM */}
      {/* -------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Add Toolkit ({mainDepartment})</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {/* Toolkit Name */}
            <div className="md:col-span-2">
              <label className="text-sm mb-1 block">Toolkit Name *</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleToolkitFormChange}
                required
              />
            </div>

            {/* Kit Number */}
            <div>
              <label className="text-sm mb-1 block">Kit Number *</label>
              <Input
                name="kitNumber"
                value={form.kitNumber}
                onChange={handleToolkitFormChange}
                required
              />
            </div>

            {/* QR Code */}
            <div>
              <label className="text-sm mb-1 block">QR Code</label>
              <Input
                name="qrCode"
                value={form.qrCode}
                readOnly
                className="bg-gray-100 text-gray-400"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="text-sm mb-1 block">Brand</label>
              <Combobox
                value={form.brand}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, brand: v }))
                }
                options={brands}
                allowCustom
                placeholder="Select or type brand"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm mb-1 block">Category</label>
              <Combobox
                value={form.category}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, category: v }))
                }
                options={categories}
                allowCustom
                placeholder="Select or type category"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-sm mb-1 block">Status *</label>
              <select
                name="status"
                value={form.status}
                onChange={handleToolkitFormChange}
                className="border rounded-md w-full px-3 py-2"
              >
                <option value="available">Available</option>
                <option value="in use">In Use</option>
                <option value="for calibration">For Calibration</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
                <option value="maintenance">Maintenance</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Main Storage */}
            <div>
              <label className="text-sm mb-1 block">Main Storage *</label>
              <select
                name="mainStorageName"
                value={form.mainStorageName}
                onChange={handleToolkitFormChange}
                className="border rounded-md px-3 py-2 w-full"
              >
                <option value="">Select Storage</option>
                {storages.map((s) => (
                  <option key={s.mainStorageName} value={s.mainStorageName}>
                    {s.mainStorageName}
                  </option>
                ))}
              </select>
            </div>

            {/* Storage Code */}
            <div>
              <label className="text-sm mb-1 block">Storage Code</label>
              <Input
                name="mainStorageCode"
                value={form.mainStorageCode}
                readOnly
                className="bg-gray-100 text-gray-500"
              />
            </div>

            {/* QR Location */}
            <div>
              <label className="text-sm mb-1 block">QR Location *</label>
              <select
                name="qrLocation"
                value={form.qrLocation}
                onChange={handleToolkitFormChange}
                className="border rounded-md px-3 py-2 w-full"
              >
                <option value="">Select QR Location</option>
                {qrLocations.map((qr) => (
                  <option key={qr} value={qr}>
                    {qr}
                  </option>
                ))}
              </select>
            </div>

            {/* Storage Type */}
            <div>
              <label className="text-sm mb-1 block">Storage Type *</label>
              <Input
                name="storageType"
                value={form.storageType}
                readOnly
                className="bg-gray-100 text-gray-500"
              />
            </div>

            {/* Submit */}
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

      {/* -------------------------------------------------- */}
      {/* TOOLKIT LIST */}
      {/* -------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Toolkits — {mainDepartment}</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : kits.length === 0 ? (
            <p>No toolkits found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kit #</TableHead>
                  <TableHead>QR Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Audit</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {kits.map((kit) => {
                  const isOpen = expanded === kit._id;

                  return (
                    <React.Fragment key={kit._id}>
                      <TableRow>
                        <TableCell>{kit.name}</TableCell>
                        <TableCell>{kit.kitNumber}</TableCell>
                        <TableCell>{kit.qrLocation}</TableCell>
                        <TableCell>{kit.status}</TableCell>
                        <TableCell>{kit.auditStatus}</TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(kit._id)}
                          >
                            {isOpen ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="bg-muted/40 p-4 rounded-md">
                              <h4 className="font-semibold mb-3">Kit Contents</h4>

                              {/* CONTENT LIST */}
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
                                      <TableHead>Audit</TableHead>
                                    </TableRow>
                                  </TableHeader>

                                  <TableBody>
                                    {kit.contents.map((item) => (
                                      <TableRow key={item._id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.brand || "-"}</TableCell>
                                        <TableCell>{item.category || "-"}</TableCell>
                                        <TableCell>{item.eqNumber || "-"}</TableCell>
                                        <TableCell>{item.qty}</TableCell>
                                        <TableCell>
                                          {item.calDate
                                            ? new Date(item.calDate).toLocaleDateString()
                                            : "-"}
                                        </TableCell>
                                        <TableCell>{item.auditStatus}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}

                              {/* CONTENT FEEDBACK */}
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

                              {/* ADD CONTENT */}
                              <h4 className="font-semibold mb-2">Add New Content</h4>

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
                                onClick={() => addKitContent(kit._id)}
                                disabled={contentLoading}
                              >
                                {contentLoading ? "Adding..." : "Add Item"}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
