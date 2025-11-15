"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function useAdminAutoLogout() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin");

    if (!isAdminRoute) {
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminDepartment");
      localStorage.removeItem("adminSessionExpiry");
      console.log("🔒 Auto-logout: exited admin route");
    }
  }, [pathname]);
}
