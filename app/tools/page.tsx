"use client";

import { useEffect, useState } from "react";
import { useDepartment } from "@/context/DepartmentContext";

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

type Tool = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  eqNumber?: string;
  qty?: number;
  status?: string;
  auditStatus?: string;
  mainStorageName: string;
  mainStorageCode: string;
  qrLocation: string;
  storageType: string;
  mainDepartment: string;
};

type StorageInfo = {
  mainStorageName: string;
  mainStorageCode: string;
};

export default function ToolsPage() {
  const { mainDepartment } = useDepartment();

  const [tools, setTools] = useState<Tool[]>([]);
  const [storages, setStorages] = useState<StorageInfo[]>([]);
  const [qrLocations, setQrLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------
  // FORM STATE
  // -----------------------------------------------------
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "",
    eqNumber: "",
    qty: "1",
    mainStorageName: "",
    mainStorageCode: "",
    qrLocation: "",
    storageType: "shelf",
  });

  // -----------------------------------------------------
  // LOAD UNIQUE STORAGE LIST FROM API
  // -----------------------------------------------------
  const loadStorages = async () => {
    if (!mainDepartment) return;

    try {
      const res = await fetch(
        `/api/tools?mainDepartment=${encodeURIComponent(
          mainDepartment
        )}&storages=1`
      );

      const data = await res.json();
      setStorages(data.storages || []);
    } catch (err) {
      console.error("Error loading storages", err);
    }
  };

  const loadQrLocations = async (storageName: string) => {
    if (!mainDepartment || !storageName) return;

    try {
      const res = await fetch(
        `/api/tools?mainDepartment=${encodeURIComponent(
          mainDepartment
        )}&mainStorageName=${encodeURIComponent(storageName)}`
      );

      const data = await res.json();
      const tools = data.tools || [];

      // Extract unique QR locations
      const unique = new Set<string>();
      tools.forEach((tool: any) => {
        if (tool.qrLocation) unique.add(tool.qrLocation);
      });

      setQrLocations([...unique]);
    } catch (err) {
      console.error("Failed to load QR locations", err);
    }
  };

  // -----------------------------------------------------
  // LOAD TOOLS BASED ON DEPARTMENT
  // -----------------------------------------------------
  const fetchTools = async () => {
    if (!mainDepartment) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/tools?mainDepartment=${encodeURIComponent(mainDepartment)}`
      );
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err) {
      console.error("Error loading tools", err);
      setError("Failed to fetch tools.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // TRIGGER LOADS WHEN DEPARTMENT CHANGES
  // -----------------------------------------------------
  useEffect(() => {
    if (mainDepartment) {
      fetchTools();
      loadStorages();
    }
  }, [mainDepartment]);

  // -----------------------------------------------------
  // AUTO-FILL mainStorageCode WHEN SELECTING STORAGE NAME
  // -----------------------------------------------------
  useEffect(() => {
    const selected = storages.find(
      (s) => s.mainStorageName === form.mainStorageName
    );

    setForm((prev) => ({
      ...prev,
      mainStorageCode: selected?.mainStorageCode || "",
    }));

    loadQrLocations(form.mainStorageName);
  }, [form.mainStorageName, storages]);

  // -----------------------------------------------------
  // HANDLE FORM INPUT
  // -----------------------------------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // -----------------------------------------------------
  // SUBMIT FORM
  // -----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mainDepartment) return;

    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const payload = {
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

      if (!res.ok) {
        throw new Error(data.error || "Error saving tool");
      }

      setSuccess("Tool created successfully!");

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
        storageType: "shelf",
      });

      fetchTools(); // reload list
      loadStorages(); // reload storage list in case a new one was created
    } catch (err: any) {
      setError(err.message || "Error creating tool.");
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------------------------------
  // IF NO DEPARTMENT SELECTED
  // -----------------------------------------------------
  if (!mainDepartment) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="font-semibold text-lg mb-2">No Department Selected</p>
        <p>Please choose a department from Settings.</p>
      </div>
    );
  }

  // -----------------------------------------------------
  // PAGE UI
  // -----------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* ----------------------------------------------- */}
      {/* ADD TOOL FORM */}
      {/* ----------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Add Tool ({mainDepartment})</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            {/* NAME */}
            <div className="md:col-span-2">
              <label className="text-sm block mb-1">Name *</label>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* BRAND */}
            <div>
              <label className="text-sm block mb-1">Brand</label>
              <Input name="brand" value={form.brand} onChange={handleChange} />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="text-sm block mb-1">Category</label>
              <Input
                name="category"
                value={form.category}
                onChange={handleChange}
              />
            </div>

            {/* EQ NUMBER */}
            <div>
              <label className="text-sm block mb-1">Eq Number</label>
              <Input
                name="eqNumber"
                value={form.eqNumber}
                onChange={handleChange}
              />
            </div>

            {/* QTY */}
            <div>
              <label className="text-sm block mb-1">Quantity</label>
              <Input
                name="qty"
                type="number"
                min={1}
                value={form.qty}
                onChange={handleChange}
              />
            </div>

            {/* MAIN STORAGE NAME */}
            <div>
              <label className="text-sm block mb-1">Main Storage *</label>
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

            {/* MAIN STORAGE CODE (AUTO, LOCKED) */}
            <div>
              <label className="text-sm block mb-1">Storage Code</label>
              <Input
                name="mainStorageCode"
                value={form.mainStorageCode}
                disabled
                className="bg-gray-100 text-gray-500"
              />
            </div>

            {/* QR LOCATION */}
            <div>
              <label className="text-sm block mb-1">QR Location *</label>

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

            {/* STORAGE TYPE */}
            <div>
              <label className="text-sm block mb-1">Storage Type *</label>
              <select
                name="storageType"
                value={form.storageType}
                onChange={handleChange}
                className="border rounded-md px-3 py-2 w-full text-sm"
              >
                <option value="shelf">Shelf</option>
                <option value="roll cab">Roll Cab</option>
                <option value="bin">Bin</option>
                <option value="cart">Cart</option>
              </select>
            </div>

            {/* SUBMIT */}
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

      {/* ----------------------------------------------- */}
      {/* TOOLS TABLE */}
      {/* ----------------------------------------------- */}
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
