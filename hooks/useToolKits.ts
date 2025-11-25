// hooks/useToolKits.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

export type KitContent = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  eqNumber?: string;
  qty: number;
  calDate?: string | null;
  auditStatus: string;
};

export type ToolKit = {
  _id: string;
  name: string;
  kitNumber: string;
  qrCode: string;
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  qrLocation: string;
  storageType: string;
  status: string;
  auditStatus: string;
  contents: KitContent[];
};

export function useToolKits(mainDepartment?: string | null) {
  const [kits, setKits] = useState<ToolKit[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======================================================
  // FETCH Toolkits
  // ======================================================
  const loadKits = useCallback(async () => {
    if (!mainDepartment) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/toolkits?mainDepartment=${encodeURIComponent(mainDepartment)}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load toolkits.");

      setKits(data.toolkits || []);
      setStorageLocations(data.storageLocations || []);
    } catch (err: any) {
      console.error("❌ useToolKits.loadKits:", err);
      setError(err.message || "Failed to load toolkits.");
      toast.error("Failed to load toolkits.");
    } finally {
      setLoading(false);
    }
  }, [mainDepartment]);

  useEffect(() => {
    loadKits();
  }, [loadKits]);

  // ======================================================
  // UPDATE Toolkit
  // ======================================================
  const updateToolkit = useCallback(
    async (id: string, changes: Partial<ToolKit>) => {
      try {
        const res = await fetch(`/api/toolkits/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update toolkit.");

        setKits((prev) =>
          prev.map((kit) => (kit._id === id ? { ...kit, ...data } : kit))
        );

        toast.success("Toolkit updated successfully.");
        return data;
      } catch (err: any) {
        console.error("❌ useToolKits.updateToolkit:", err);
        toast.error(err.message || "Failed to update toolkit.");
        throw err;
      }
    },
    []
  );

  // ======================================================
  // DELETE Toolkit
  // ======================================================
  const deleteToolkit = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/toolkits/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete toolkit.");

      setKits((prev) => prev.filter((kit) => kit._id !== id));

      toast.success("Toolkit deleted (including kit contents).");
      return true;
    } catch (err: any) {
      console.error("❌ useToolKits.deleteToolkit:", err);
      toast.error(err.message || "Failed to delete toolkit.");
      throw err;
    }
  }, []);

  // ======================================================
  // ADD Kit Content Item
  // ======================================================
  const addKitContent = useCallback(
    async (kitId: string, item: Partial<KitContent>) => {
      try {
        const res = await fetch(`/api/toolkits/${kitId}/contents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add kit content.");

        // Replace toolkit with updated version from server
        setKits((prev) =>
          prev.map((kit) => (kit._id === kitId ? data : kit))
        );

        toast.success("Kit content added.");
        return data;
      } catch (err: any) {
        console.error("❌ useToolKits.addKitContent:", err);
        toast.error(err.message || "Failed to add content item.");
        throw err;
      }
    },
    []
  );

  // ======================================================
  // UPDATE Kit Content Item
  // ======================================================
  const updateKitContent = useCallback(
    async (kitId: string, contentId: string, changes: Partial<KitContent>) => {
      try {
        const res = await fetch(
          `/api/toolkits/${kitId}/contents/${contentId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(changes),
          }
        );

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to update kit content.");

        // Replace toolkit with updated version from server
        setKits((prev) =>
          prev.map((kit) => (kit._id === kitId ? data : kit))
        );

        toast.success("Kit item updated.");
        return data;
      } catch (err: any) {
        console.error("❌ useToolKits.updateKitContent:", err);
        toast.error(err.message || "Failed to update content item.");
        throw err;
      }
    },
    []
  );

  // ======================================================
  // DELETE Kit Content Item
  // ======================================================
  const deleteKitContent = useCallback(
    async (kitId: string, contentId: string) => {
      try {
        const res = await fetch(
          `/api/toolkits/${kitId}/contents/${contentId}`,
          { method: "DELETE" }
        );

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to delete kit content.");

        // Replace toolkit with updated version from server
        setKits((prev) =>
          prev.map((kit) => (kit._id === kitId ? data : kit))
        );

        toast.success("Kit content deleted.");
        return true;
      } catch (err: any) {
        console.error("❌ useToolKits.deleteKitContent:", err);
        toast.error(err.message || "Failed to delete content item.");
        throw err;
      }
    },
    []
  );

  // ======================================================
  // RETURN
  // ======================================================
  return {
    kits,
    storageLocations,
    loading,
    error,
    refresh: loadKits,

    // Toolkit actions
    updateToolkit,
    deleteToolkit,

    // Kit content actions
    addKitContent,
    updateKitContent,
    deleteKitContent,
  };
}
