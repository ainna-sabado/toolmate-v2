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

  // Forms
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");

  const [storageName, setStorageName] = useState("");
  const [storageCode, setStorageCode] = useState("");
  const [storageType, setStorageType] = useState("");

  const [rowName, setRowName] = useState("");
  const [rowQrCode, setRowQrCode] = useState("");

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
  // HANDLERS
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
      setTypes((prev) => [...prev, data].sort((a, b) =>
        a.name.localeCompare(b.name)
      ));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to add storage type");
    } finally {
      setSavingType(false);
    }
  };

  const handleAddStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainDepartment) return;
    if (!storageName.trim() || !storageCode.trim() || !storageType.trim()) return;

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
  };

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

      setStorages((prev) =>
        prev.map((s) => (s._id === data._id ? data : s))
      );
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTypes && (
                    <TableRow>
                      <TableCell colSpan={2}>Loading types…</TableCell>
                    </TableRow>
                  )}
                  {!loadingTypes && types.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-sm text-gray-500"
                      >
                        No storage types yet. Add one above.
                      </TableCell>
                    </TableRow>
                  )}
                  {types.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.description}</TableCell>
                    </TableRow>
                  ))}
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
              <CardTitle className="text-base">
                Main Storages (per department)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={handleAddStorage}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3"
              >
                <Input
                  placeholder="Name e.g. Wiring Harness Tooling"
                  value={storageName}
                  onChange={(e) => setStorageName(e.target.value)}
                />
                <Input
                  placeholder="Code e.g. RC-01"
                  value={storageCode}
                  onChange={(e) => setStorageCode(e.target.value)}
                />
                <Input
                  placeholder="Type e.g. Roll Cabinet"
                  list="storage-types-list"
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value)}
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
                      <TableHead className="w-24">Rows</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingStorages && (
                      <TableRow>
                        <TableCell colSpan={4}>Loading storages…</TableCell>
                      </TableRow>
                    )}
                    {!loadingStorages && storages.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-sm text-gray-500"
                        >
                          No storages configured yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {storages.map((loc) => (
                      <TableRow
                        key={loc._id}
                        className={
                          selectedStorage?._id === loc._id
                            ? "bg-blue-50 cursor-pointer"
                            : "cursor-pointer"
                        }
                        onClick={() => handleSelectStorage(loc)}
                      >
                        <TableCell className="font-medium">
                          {loc.mainStorageName}
                        </TableCell>
                        <TableCell>{loc.mainStorageCode}</TableCell>
                        <TableCell>{loc.storageType}</TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {loc.qrLocations?.length ?? 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Row / QR locations for selected storage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Row / QR Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedStorage ? (
                <p className="text-sm text-gray-500">
                  Select a main storage above (e.g.{" "}
                  <span className="italic">
                    Wiring Harness Tooling, RC-01
                  </span>
                  ) to manage its row locations.
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
                      placeholder="Row name e.g. Row 1, A1"
                      value={rowName}
                      onChange={(e) => setRowName(e.target.value)}
                    />
                    <Input
                      placeholder="QR code value"
                      value={rowQrCode}
                      onChange={(e) => setRowQrCode(e.target.value)}
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!selectedStorage.qrLocations ||
                        selectedStorage.qrLocations.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              className="text-sm text-gray-500"
                            >
                              No row locations yet. Add one above.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedStorage.qrLocations.map((qr) => (
                            <TableRow key={qr._id}>
                              <TableCell className="font-medium">
                                {qr.rowName}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {qr.qrCode}
                              </TableCell>
                            </TableRow>
                          ))
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
