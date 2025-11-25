// hooks/useTools.ts
"use client";

import { useEffect, useState, useCallback } from "react";

export type Tool = {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  eqNumber?: string;
  qty?: number;
  status?: string;
  mainStorageName?: string;
  mainStorageCode?: string;
  qrLocation?: string;
  storageType?: string;
  dueDate?: string | null;
};

export function useTools(mainDepartment?: string | null) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------
  // LOAD TOOLS
  // ---------------------------
  const fetchTools = useCallback(async () => {
    let dept = mainDepartment ?? null;

    if (!dept && typeof window !== "undefined") {
      const stored = window.localStorage.getItem("mainDepartment");
      if (stored) dept = stored;
    }

    if (!dept) {
      // No department selected yet
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/tools?mainDepartment=${encodeURIComponent(dept)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load tools.");
      }

      // API returns { tools }
      const list: Tool[] = Array.isArray(data)
        ? data
        : (data.tools as Tool[]) || [];

      setTools(list);
    } catch (err: any) {
      console.error("useTools: fetchTools error", err);
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [mainDepartment]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // ---------------------------
  // UPDATE TOOL
  // ---------------------------
  const updateTool = useCallback(
    async (id: string, changes: Partial<Tool>) => {
      if (!id) {
        console.error("useTools.updateTool called with empty id", { id, changes });
        throw new Error("Cannot update tool: missing tool ID on client.");
      }

      const res = await fetch(`/api/tools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("useTools.updateTool API error", data);
        throw new Error(data.error || "Failed to update tool.");
      }

      // data is the updated Tool from the API
      const updated = data as Tool;

      setTools((prev) =>
        prev.map((tool) => (tool._id === updated._id ? updated : tool))
      );

      return updated;
    },
    []
  );

  // ---------------------------
  // DELETE TOOL
  // ---------------------------
  const deleteTool = useCallback(async (id: string) => {
    if (!id) {
      console.error("useTools.deleteTool called with empty id", { id });
      throw new Error("Cannot delete tool: missing tool ID on client.");
    }

    const res = await fetch(`/api/tools/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("useTools.deleteTool API error", data);
      throw new Error(data.error || "Failed to delete tool.");
    }

    setTools((prev) => prev.filter((tool) => tool._id !== id));

    return true;
  }, []);

  return {
    tools,
    loading,
    error,
    refresh: fetchTools,
    updateTool,
    deleteTool,
  };
}
