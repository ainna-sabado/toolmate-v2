"use client";

import React, { useEffect, useState } from "react";
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

import { ChevronDown, ChevronUp } from "lucide-react";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
type KitContent = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  eqNumber?: string;
  qty: number;
  calDate?: string;
  auditStatus: string;
};

type ToolKit = {
  _id: string;
  name: string;
  kitNumber: string;
  brand?: string;
  category?: string;
  qrCode: string;
  mainStorageName: string;
  mainStorageCode: string;
  qrLocation: string;
  storageType: string;
  mainDepartment: string;
  status: string;
  auditStatus: string;
  contents: KitContent[];
};

type NewKitContentForm = {
  name: string;
  brand: string;
  category: string;
  eqNumber: string;
  qty: string;
  calDate: string;
};

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------
export default function ToolKitsPage() {
  const { mainDepartment } = useDepartment();

  const [kits, setKits] = useState<ToolKit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Toolkit form
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Content form
  const [contentForm, setContentForm] = useState<NewKitContentForm>({
    name: "",
    brand: "",
    category: "",
    eqNumber: "",
    qty: "1",
    calDate: "",
  });

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

  // ---------------------------------------------------------
  // Fetch toolkits (filtered by department)
  // ---------------------------------------------------------
  const fetchKits = async () => {
    if (!mainDepartment) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/toolkits?mainDepartment=${encodeURIComponent(mainDepartment)}`
      );

      const data = await res.json();
      setKits(data.toolkits || []);
    } catch (err: any) {
      setError("Failed to load toolkits");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchKits();
  }, [mainDepartment]);

  // ---------------------------------------------------------
  // Prevent using page until department is selected
  // ---------------------------------------------------------
  if (!mainDepartment) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg font-semibold mb-2">No Department Selected</p>
        <p>Please choose a department from the settings menu.</p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Handle input changes
  // ---------------------------------------------------------
  const handleToolkitFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContentForm((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------------------------------------------------
  // Submit Toolkit (auto-inject mainDepartment)
  // ---------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: any = {
        name: form.name.trim(),
        kitNumber: form.kitNumber.trim(),
        qrCode: form.qrCode.trim(),

        mainDepartment, // ⭐ auto injected
        mainStorageName: form.mainStorageName.trim(),
        mainStorageCode: form.mainStorageCode.trim(),
        qrLocation: form.qrLocation.trim(),
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

      fetchKits();
    } catch (err: any) {
      setError(err.message);
    }

    setSubmitting(false);
  };

  // ---------------------------------------------------------
  // Add Content Item
  // ---------------------------------------------------------
  const addKitContent = async (kitId: string) => {
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

      // Reset content form
      setContentForm({
        name: "",
        brand: "",
        category: "",
        eqNumber: "",
        qty: "1",
        calDate: "",
      });

      fetchKits();
      setSuccess("Added item successfully.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* -------------------------------------------------------
          ADD TOOLKIT
      -------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Add Toolkit ({mainDepartment})</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm mb-1 block">Toolkit Name *</label>
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
              <label className="text-sm mb-1 block">QR Code *</label>
              <Input
                name="qrCode"
                value={form.qrCode}
                onChange={handleToolkitFormChange}
                required
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Brand</label>
              <Input
                name="brand"
                value={form.brand}
                onChange={handleToolkitFormChange}
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Category</label>
              <Input
                name="category"
                value={form.category}
                onChange={handleToolkitFormChange}
              />
            </div>

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

            <div>
              <label className="text-sm mb-1 block">Main Storage *</label>
              <Input
                name="mainStorageName"
                value={form.mainStorageName}
                onChange={handleToolkitFormChange}
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">Main Storage Code *</label>
              <Input
                name="mainStorageCode"
                value={form.mainStorageCode}
                onChange={handleToolkitFormChange}
              />
            </div>

            <div>
              <label className="text-sm mb-1 block">QR Location *</label>
              <select
                name="qrLocation"
                value={form.qrLocation}
                onChange={handleToolkitFormChange}
                className="border rounded-md px-3 py-2 w-full"
              >
                <option value="SHA-RW01">SHA-RW01</option>
                <option value="SHA-RW02">SHA-RW02</option>
                <option value="SHA-RW03">SHA-RW03</option>
              </select>
            </div>

            <div>
              <label className="text-sm mb-1 block">Storage Type *</label>
              <select
                name="storageType"
                value={form.storageType}
                onChange={handleToolkitFormChange}
                className="border rounded-md px-3 py-2 w-full"
              >
                <option value="shelf">Shelf</option>
                <option value="roll cab">Roll Cab</option>
                <option value="bin">Bin</option>
                <option value="cart">Cart</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-4">
              <Button disabled={submitting}>
                {submitting ? "Saving..." : "Save Toolkit"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* -------------------------------------------------------
          TOOLKITS TABLE
      -------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Toolkits — {mainDepartment}</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : kits.length === 0 ? (
            <p>No toolkits found for this department.</p>
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

                      {/* Expanded – Kit Contents */}
                      {isOpen && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="bg-muted/40 p-4 rounded-md">
                              <h4 className="font-semibold mb-3">
                                Kit Contents
                              </h4>

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
                                        <TableCell>
                                          {item.brand || "-"}
                                        </TableCell>
                                        <TableCell>
                                          {item.category || "-"}
                                        </TableCell>
                                        <TableCell>
                                          {item.eqNumber || "-"}
                                        </TableCell>
                                        <TableCell>{item.qty}</TableCell>
                                        <TableCell>
                                          {item.calDate
                                            ? new Date(
                                                item.calDate
                                              ).toLocaleDateString()
                                            : "-"}
                                        </TableCell>
                                        <TableCell>
                                          {item.auditStatus}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}

                              {/* Add new content form */}
                              <h4 className="font-semibold mb-2">
                                Add New Content
                              </h4>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <Input
                                  name="name"
                                  value={contentForm.name}
                                  onChange={handleContentChange}
                                  placeholder="Name *"
                                  required
                                />

                                <Input
                                  name="brand"
                                  value={contentForm.brand}
                                  onChange={handleContentChange}
                                  placeholder="Brand"
                                />

                                <Input
                                  name="category"
                                  value={contentForm.category}
                                  onChange={handleContentChange}
                                  placeholder="Category"
                                />

                                <Input
                                  name="eqNumber"
                                  value={contentForm.eqNumber}
                                  onChange={handleContentChange}
                                  placeholder="Eq Number"
                                />

                                <Input
                                  name="qty"
                                  type="number"
                                  min="1"
                                  value={contentForm.qty}
                                  onChange={handleContentChange}
                                  placeholder="Qty"
                                />

                                <Input
                                  name="calDate"
                                  type="date"
                                  value={contentForm.calDate}
                                  onChange={handleContentChange}
                                />
                              </div>

                              <Button
                                className="mt-4"
                                onClick={() => {
                                  console.log("🟢 addKitContent for:", kit._id);
                                  addKitContent(kit._id);
                                }}
                              >
                                Add Item
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
