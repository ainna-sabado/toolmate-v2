"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* HEADER (fixed) */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* SIDEBAR DRAWER */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-16"> 
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
