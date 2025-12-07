"use client";

import { useEffect, useState } from "react";
import { useDepartment } from "@/context/DepartmentContext";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Pen, Trash2 } from "lucide-react";

// ---- Types ----
type StorageType = {
  _id: string;
  name: string;
  description?: string;
};

type QrLocation = {
  _id: string;
  rowName: string;
  qrCode: string;
};

type StorageLocation = {
  _id: string;
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType: string;
  qrLocations?: QrLocation[];
};

// --------------------------------------------------
// Storage Settings Page
// --------------------------------------------------
export default function StorageSettingsPage() {
  const { mainDepartment } = useDepartment();

  const [types, setTypes] = useState<StorageType[]>([]);
  const [storages, setStorages] = useState<StorageLocation[]>([]);
  const [selectedStorage, setSelectedStorage] =
    useState<StorageLocation | null>(null);

  // Forms – add
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");

  const [storageName, setStorageName] = useState("");
  const [storageCode, setStorageCode] = useState("");
  const [storageType, setStorageType] = useState("");

  const [rowName, setRowName] = useState("");
  const [rowQrCode, setRowQrCode] = useState("");

  // Edit state – storage types
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeDescription, setEditTypeDescription] = useState("");
  const [savingTypeEdit, setSavingTypeEdit] = useState(false);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  // Edit state – main storages
  const [editingStorageId, setEditingStorageId] = useState<string | null>(null);
  const [editStorageName, setEditStorageName] = useState("");
  const [editStorageCode, setEditStorageCode] = useState("");
  const [editStorageType, setEditStorageType] = useState("");
  const [savingStorageEdit, setSavingStorageEdit] = useState(false);
  const [deletingStorageId, setDeletingStorageId] = useState<string | null>(
    null
  );

  // Edit state – row / QR locations
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowName, setEditRowName] = useState("");
  const [editRowQrCode, setEditRowQrCode] = useState("");
  const [savingRowEdit, setSavingRowEdit] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingStorages, setLoadingStorages] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [savingStorage, setSavingStorage] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  // -----------------------------
  // LOAD STORAGE TYPES
  // -----------------------------
  const loadTypes = async () => {
    try {
      setLoadingTypes(true);
      setError(null);

      const res = await fetch("/api/storage-types");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load types");

      setTypes(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load storage types");
    } finally {
      setLoadingTypes(false);
    }
  };

  // -----------------------------
  // LOAD MAIN STORAGES
  // -----------------------------
  const loadStorages = async () => {
    if (!mainDepartment) return;

    try {
      setLoadingStorages(true);
      setError(null);

      const res = await fetch(
        `/api/storage-locations?mainDepartment=${encodeURIComponent(
          mainDepartment
        )}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load storages");

      setStorages(data);

      if (selectedStorage) {
        const refreshed = data.find(
          (s: StorageLocation) => s._id === selectedStorage._id
        );
        setSelectedStorage(refreshed || null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load storages");
    } finally {
      setLoadingStorages(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    loadStorages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainDepartment]);

  // -----------------------------
  // HANDLERS – STORAGE TYPES
  // -----------------------------
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    try {
      setSavingType(true);
      setError(null);

      const res = await fetch("/api/storage-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTypeName,
          description: newTypeDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add type");

      setNewTypeName("");
      setNewTypeDescription("");
      setTypes((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to add storage type");
    } finally {
      setSavingType(false);
    }
  };

  const startEditType = (t: StorageType) => {
    setEditingTypeId(t._id);
    setEditTypeName(t.name);
    setEditTypeDescription(t.description || "");
  };

  const cancelEditType = () => {
    setEditingTypeId(null);
    setEditTypeName("");
    setEditTypeDescription("");
  };

  const handleSaveEditType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTypeId) return;

    try {
      setSavingTypeEdit(true);
      setError(null);

      const res = await fetch("/api/storage-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTypeId,
          name: editTypeName,
          description: editTypeDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update type");

      setTypes((prev) =>
        prev
          .map((t) => (t._id === data._id ? data : t))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEditType();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to update storage type");
    } finally {
      setSavingTypeEdit(false);
    }
  };

  const handleDeleteType = async (t: StorageType) => {
    const confirmDelete = window.confirm(
      `Delete storage type "${t.name}"? This will not affect existing storages that already use this name, but the type will no longer be listed.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingTypeId(t._id);
      setError(null);

      const res = await fetch("/api/storage-types", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete type");

      setTypes((prev) => prev.filter((x) => x._id !== t._id));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to delete storage type");
    } finally {
      setDeletingTypeId(null);
    }
  };

  // -----------------------------
  // HANDLERS – MAIN STORAGES
  // -----------------------------
  const handleAddStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainDepartment) return;
    if (!storageName.trim() || !storageCode.trim() || !storageType.trim())
      return;

    try {
      setSavingStorage(true);
      setError(null);

      const res = await fetch("/api/storage-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainDepartment,
          mainStorageName: storageName,
          mainStorageCode: storageCode,
          storageType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add storage");

      setStorageName("");
      setStorageCode("");
      setStorageType("");

      setStorages((prev) => [...prev, data]);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to add storage");
    } finally {
      setSavingStorage(false);
    }
  };

  const handleSelectStorage = (loc: StorageLocation) => {
    setSelectedStorage(loc);
    setRowName("");
    setRowQrCode("");
    setEditingRowId(null);
  };

  const startEditStorage = (loc: StorageLocation) => {
    setEditingStorageId(loc._id);
    setEditStorageName(loc.mainStorageName);
    setEditStorageCode(loc.mainStorageCode);
    setEditStorageType(loc.storageType);
  };

  const cancelEditStorage = () => {
    setEditingStorageId(null);
    setEditStorageName("");
    setEditStorageCode("");
    setEditStorageType("");
  };

  const handleSaveEditStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStorageId) return;

    try {
      setSavingStorageEdit(true);
      setError(null);

      const res = await fetch("/api/storage-locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStorageId,
          mainStorageName: editStorageName,
          mainStorageCode: editStorageCode,
          storageType: editStorageType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update storage");

      setStorages((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      if (selectedStorage?._id === data._id) {
        setSelectedStorage(data);
      }
      cancelEditStorage();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to update storage");
    } finally {
      setSavingStorageEdit(false);
    }
  };

  const handleDeleteStorage = async (loc: StorageLocation) => {
    const confirmDelete = window.confirm(
      `Soft delete main storage "${loc.mainStorageName}" (${loc.mainStorageCode})? This will hide it from the system but keep existing audit history.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingStorageId(loc._id);
      setError(null);

      const res = await fetch("/api/storage-locations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loc._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete storage");

      setStorages((prev) => prev.filter((s) => s._id !== loc._id));
      if (selectedStorage?._id === loc._id) {
        setSelectedStorage(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to delete storage");
    } finally {
      setDeletingStorageId(null);
    }
  };

  // -----------------------------
  // HANDLERS – ROW / QR LOCATIONS
  // -----------------------------
  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStorage) return;
    if (!rowName.trim() || !rowQrCode.trim()) return;

    try {
      setSavingRow(true);
      setError(null);

      const res = await fetch(
        `/api/storage-locations/${selectedStorage._id}/qr-locations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowName,
            qrCode: rowQrCode,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add row");

      setStorages((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      setSelectedStorage(data);

      setRowName("");
      setRowQrCode("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to add row location");
    } finally {
      setSavingRow(false);
    }
  };

  const startEditRow = (qr: QrLocation) => {
    setEditingRowId(qr._id);
    setEditRowName(qr.rowName);
    setEditRowQrCode(qr.qrCode);
  };

  const cancelEditRow = () => {
    setEditingRowId(null);
    setEditRowName("");
    setEditRowQrCode("");
  };

  const handleSaveEditRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStorage || !editingRowId) return;

    try {
      setSavingRowEdit(true);
      setError(null);

      const res = await fetch(
        `/api/storage-locations/${selectedStorage._id}/qr-locations`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qrLocationId: editingRowId,
            rowName: editRowName,
            qrCode: editRowQrCode,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update row");

      setStorages((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      setSelectedStorage(data);
      cancelEditRow();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to update row location");
    } finally {
      setSavingRowEdit(false);
    }
  };

  const handleDeleteRow = async (qr: QrLocation) => {
    if (!selectedStorage) return;

    const confirmDelete = window.confirm(
      `Delete row "${qr.rowName}" (${qr.qrCode}) from this storage?`
    );
    if (!confirmDelete) return;

    try {
      setDeletingRowId(qr._id);
      setError(null);

      const res = await fetch(
        `/api/storage-locations/${selectedStorage._id}/qr-locations`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrLocationId: qr._id }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete row");

      setStorages((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      setSelectedStorage(data);
      if (editingRowId === qr._id) {
        cancelEditRow();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to delete row location");
    } finally {
      setDeletingRowId(null);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Storage Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure main storage locations and their row/QR locations for{" "}
          <span className="font-medium">
            {mainDepartment || "your department"}
          </span>
          .
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 border border-red-200 rounded-md px-3 py-2 bg-red-50">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Types */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Storage Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleAddType}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Input
                placeholder="e.g. Roll Cabinet, Shelf"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
              <Input
                placeholder="Optional description"
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
              />
              <Button type="submit" disabled={savingType}>
                {savingType ? "Saving..." : "Add"}
              </Button>
            </form>

            <div className="border rounded-md max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTypes && (
                    <TableRow>
                      <TableCell colSpan={3}>Loading types…</TableCell>
                    </TableRow>
                  )}
                  {!loadingTypes && types.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-gray-500">
                        No storage types yet. Add one above.
                      </TableCell>
                    </TableRow>
                  )}
                  {types.map((t) => {
                    const isEditing = editingTypeId === t._id;
                    return (
                      <TableRow key={t._id}>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              value={editTypeName}
                              onChange={(e) => setEditTypeName(e.target.value)}
                              className="h-7 text-xs"
                            />
                          ) : (
                            t.name
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editTypeDescription}
                              onChange={(e) =>
                                setEditTypeDescription(e.target.value)
                              }
                              className="h-7 text-xs"
                            />
                          ) : (
                            t.description
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={savingTypeEdit}
                                onClick={handleSaveEditType}
                              >
                                {savingTypeEdit ? "Saving…" : "Save"}
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={cancelEditType}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="xs"
                                variant="ghost"
                                className="p-1"
                                onClick={() => startEditType(t)}
                                aria-label="Edit storage type"
                              >
                                <Pen className="h-3 w-3" />
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                className="p-1 text-red-600"
                                disabled={deletingTypeId === t._id}
                                onClick={() => handleDeleteType(t)}
                                aria-label="Delete storage type"
                              >
                                {deletingTypeId === t._id ? (
                                  <span className="text-[10px]">…</span>
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Main Storages + Row Locations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main storages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Main Storages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={handleAddStorage}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3"
              >
                <Input
                  className="uppercase"
                  placeholder="Name e.g. WIRING HARNESS TOOLING"
                  value={storageName}
                  onChange={(e) => setStorageName(e.target.value.toUpperCase())}
                />

                <Input
                  className="uppercase"
                  placeholder="Code e.g. RC-01"
                  value={storageCode}
                  onChange={(e) => setStorageCode(e.target.value.toUpperCase())}
                />

                <Input
                  className="uppercase"
                  placeholder="Type e.g. ROLL CABINET"
                  list="storage-types-list"
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value.toUpperCase())}
                />

                <datalist id="storage-types-list">
                  {types.map((t) => (
                    <option key={t._id} value={t.name} />
                  ))}
                </datalist>
                <Button
                  type="submit"
                  disabled={savingStorage || !mainDepartment}
                >
                  {savingStorage ? "Saving..." : "Add"}
                </Button>
              </form>

              <div className="border rounded-md max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingStorages && (
                      <TableRow>
                        <TableCell colSpan={5}>Loading storages…</TableCell>
                      </TableRow>
                    )}
                    {!loadingStorages && storages.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-sm text-gray-500"
                        >
                          No storages configured yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {storages.map((loc) => {
                      const isEditing = editingStorageId === loc._id;
                      return (
                        <TableRow
                          key={loc._id}
                          className={
                            selectedStorage?._id === loc._id
                              ? "bg-blue-50"
                              : undefined
                          }
                        >
                          <TableCell
                            className="font-medium cursor-pointer"
                            onClick={() => handleSelectStorage(loc)}
                          >
                            {isEditing ? (
                              <Input
                                className="h-7 text-xs uppercase"
                                value={editStorageName}
                                onChange={(e) =>
                                  setEditStorageName(
                                    e.target.value.toUpperCase()
                                  )
                                }
                              />
                            ) : (
                              loc.mainStorageName
                            )}
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleSelectStorage(loc)}
                          >
                            {isEditing ? (
                              <Input
                                className="h-7 text-xs uppercase"
                                value={editStorageCode}
                                onChange={(e) =>
                                  setEditStorageCode(
                                    e.target.value.toUpperCase()
                                  )
                                }
                              />
                            ) : (
                              loc.mainStorageCode
                            )}
                          </TableCell>
                          <TableCell
                            className="cursor-pointer"
                            onClick={() => handleSelectStorage(loc)}
                          >
                            {isEditing ? (
                              <Input
                                className="h-7 text-xs uppercase"
                                value={editStorageType}
                                onChange={(e) =>
                                  setEditStorageType(
                                    e.target.value.toUpperCase()
                                  )
                                }
                              />
                            ) : (
                              loc.storageType
                            )}
                          </TableCell>
                          <TableCell
                            className="text-xs text-gray-600 cursor-pointer"
                            onClick={() => handleSelectStorage(loc)}
                          >
                            {loc.qrLocations?.length ?? 0}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {isEditing ? (
                              <>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  disabled={savingStorageEdit}
                                  onClick={handleSaveEditStorage}
                                >
                                  {savingStorageEdit ? "Saving…" : "Save"}
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={cancelEditStorage}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="p-1"
                                  onClick={() => startEditStorage(loc)}
                                  aria-label="Edit storage"
                                >
                                  <Pen className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="p-1 text-red-600"
                                  disabled={deletingStorageId === loc._id}
                                  onClick={() => handleDeleteStorage(loc)}
                                  aria-label="Delete storage"
                                >
                                  {deletingStorageId === loc._id ? (
                                    <span className="text-[10px]">…</span>
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Row / QR locations for selected storage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rows / QR Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedStorage ? (
                <p className="text-sm text-gray-500">
                  Select a main storage above (e.g.{" "}
                  <span className="italic">WIRING HARNESS TOOLING, RC-01</span>)
                  to manage its row locations.
                </p>
              ) : (
                <>
                  <div className="text-sm">
                    <div className="font-medium">
                      {selectedStorage.mainStorageName}
                    </div>
                    <div className="text-gray-500">
                      Code: {selectedStorage.mainStorageCode} · Type:{" "}
                      {selectedStorage.storageType}
                    </div>
                  </div>

                  <form
                    onSubmit={handleAddRow}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <Input
                      className="uppercase"
                      placeholder="Row name e.g. ROW 1, A1"
                      value={rowName}
                      onChange={(e) => setRowName(e.target.value.toUpperCase())}
                    />

                    <Input
                      className="uppercase"
                      placeholder="QR code value"
                      value={rowQrCode}
                      onChange={(e) =>
                        setRowQrCode(e.target.value.toUpperCase())
                      }
                    />

                    <Button type="submit" disabled={savingRow}>
                      {savingRow ? "Saving..." : "Add"}
                    </Button>
                  </form>

                  <div className="border rounded-md max-h-64 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row Name</TableHead>
                          <TableHead>QR Code</TableHead>
                          <TableHead className="w-32 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!selectedStorage.qrLocations ||
                        selectedStorage.qrLocations.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-sm text-gray-500"
                            >
                              No row locations yet. Add one above.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedStorage.qrLocations.map((qr) => {
                            const isEditing = editingRowId === qr._id;
                            return (
                              <TableRow key={qr._id}>
                                <TableCell className="font-medium">
                                  {isEditing ? (
                                    <Input
                                      className="h-7 text-xs uppercase"
                                      value={editRowName}
                                      onChange={(e) =>
                                        setEditRowName(
                                          e.target.value.toUpperCase()
                                        )
                                      }
                                    />
                                  ) : (
                                    qr.rowName
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {isEditing ? (
                                    <Input
                                      className="h-7 text-xs uppercase"
                                      value={editRowQrCode}
                                      onChange={(e) =>
                                        setEditRowQrCode(
                                          e.target.value.toUpperCase()
                                        )
                                      }
                                    />
                                  ) : (
                                    qr.qrCode
                                  )}
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        disabled={savingRowEdit}
                                        onClick={handleSaveEditRow}
                                      >
                                        {savingRowEdit ? "Saving…" : "Save"}
                                      </Button>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={cancelEditRow}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        className="p-1"
                                        onClick={() => startEditRow(qr)}
                                        aria-label="Edit row"
                                      >
                                        <Pen className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        className="p-1 text-red-600"
                                        disabled={deletingRowId === qr._id}
                                        onClick={() => handleDeleteRow(qr)}
                                        aria-label="Delete row"
                                      >
                                        {deletingRowId === qr._id ? (
                                          <span className="text-[10px]">…</span>
                                        ) : (
                                          <Trash2 className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
