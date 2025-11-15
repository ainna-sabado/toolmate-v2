import type { Metadata } from "next";
import "./globals.css";
import { DepartmentProvider } from "@/context/DepartmentContext";
import AppShell from "@/components/layout/AppShell";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ToolMate",
  description: "Aviation Tool Tracking System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DepartmentProvider>
          <AppShell>{children}</AppShell>
          {/* 🔥 REQUIRED FOR TOASTS TO WORK */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 2500,
              style: { fontSize: "14px" },
            }}
          />
        </DepartmentProvider>
      </body>
    </html>
  );
}
