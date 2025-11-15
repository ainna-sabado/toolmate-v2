// hooks/useToolMeta.ts
"use client";

import { useEffect, useState } from "react";

export function useToolMeta() {
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMeta = async () => {
    try {
      const res = await fetch("/api/tools/meta");
      const data = await res.json();
      setBrands(data.brands || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  return { brands, categories, loading, refresh: loadMeta };
}
