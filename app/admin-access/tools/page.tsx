"use client";

import { useState, useEffect } from "react";
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

// 👍 If using shadcn Combobox
import { Combobox } from "@/components/ui/combobox";

export default function ToolsPage() {
  const { mainDepartment } = useDepartment();

  // HOOKS
  const { tools, loading, refresh: refreshTools } = useTools(mainDepartment);
  const { storages, qrLocations, loadQrLocations } = useStorage(mainDepartment);
  const { brands, categories } = useToolMeta();

  // FORM
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

  // Auto-fill storageCode + storageType when selecting a storage
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

  // FORM HANDLER
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // SUBMIT NEW TOOL
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
      if (!res.ok) throw new Error(data.error);

      setSuccess("Tool created successfully.");

      // Reset form
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
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // NO DEPARTMENT
  if (!mainDepartment) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="font-semibold text-lg mb-2">No Department Selected</p>
        <p>Please choose a department from Settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* ------------------------------------------------ */}
      {/* ADD TOOL FORM */}
      {/* ------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Add Tool ({mainDepartment})</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="text-sm mb-1 block">Name *</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Brand with Combobox */}
            <div>
              <label className="text-sm mb-1 block">Brand</label>
              <Combobox
                value={form.brand}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, brand: v }))
                }
                options={brands}
                allowCustom
                placeholder="Select or type a brand"
              />
            </div>

            {/* Category with Combobox */}
            <div>
              <label className="text-sm mb-1 block">Category</label>
              <Combobox
                value={form.category}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, category: v }))
                }
                options={categories}
                allowCustom
                placeholder="Select or type a category"
              />
            </div>

            {/* Eq Number */}
            <div>
              <label className="text-sm mb-1 block">Eq Number</label>
              <Input
                name="eqNumber"
                value={form.eqNumber}
                onChange={handleChange}
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="text-sm mb-1 block">Quantity *</label>
              <Input
                name="qty"
                type="number"
                min="1"
                value={form.qty}
                onChange={handleChange}
              />
            </div>

            {/* Storage selection */}
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
                {storages.map((s) => (
                  <option key={s.mainStorageName} value={s.mainStorageName}>
                    {s.mainStorageName}
                  </option>
                ))}
              </select>
            </div>

            {/* Autoload Storage Code */}
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
                onChange={handleChange}
                required
                className="border rounded-md px-3 py-2 w-full text-sm"
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

      {/* ------------------------------------------------ */}
      {/* TOOLS TABLE */}
      {/* ------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Tools — {mainDepartment}</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : tools.length === 0 ? (
            <p>No tools found for this department.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Eq #</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>QR Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audit</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool._id}>
                      <TableCell>{tool.name}</TableCell>
                      <TableCell>{tool.brand || "-"}</TableCell>
                      <TableCell>{tool.category || "-"}</TableCell>
                      <TableCell>{tool.eqNumber || "-"}</TableCell>
                      <TableCell>{tool.qty ?? 1}</TableCell>
                      <TableCell>{tool.qrLocation}</TableCell>
                      <TableCell>{tool.status || "available"}</TableCell>
                      <TableCell>{tool.auditStatus || "pending"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
