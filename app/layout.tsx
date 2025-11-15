"use client";

import "./globals.css";
import { useState } from "react";
import { DepartmentProvider } from "@/context/DepartmentContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body>
        <DepartmentProvider>
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="pt-16">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>

          <Footer />
        </DepartmentProvider>
      </body>
    </html>
  );
}
