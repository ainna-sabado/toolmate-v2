// hooks/useTools.ts
"use client";

import { useEffect, useState, useCallback } from "react";

export function useTools(mainDepartment?: string) {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTools = useCallback(async () => {
    if (!mainDepartment) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/api/tools?mainDepartment=${encodeURIComponent(mainDepartment)}`
      );
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err) {
      console.error("Failed to load tools:", err);
    } finally {
      setLoading(false);
    }
  }, [mainDepartment]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  return { tools, loading, refresh: loadTools };
}
