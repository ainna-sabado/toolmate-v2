"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function useAdminAutoLogout() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdminRoute = pathname.startsWith("/admin-access");

    if (!isAdminRoute) {
      console.log("🔒 Auto-logout: exited admin routes");
      // Clear the cookie on server
      fetch("/api/admin/session/logout", { method: "POST" });
    }
  }, [pathname]);
}
