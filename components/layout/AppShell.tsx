"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAdminAutoLogout } from "@/hooks/useAdminAutoLogout"; 

export default function AppShell({ children }: { children: React.ReactNode }) {
  useAdminAutoLogout(); 

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN */}
      <main
        className="
          flex-1
          pt-[110px]
          md:pt-[72px]
        "
      >
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
