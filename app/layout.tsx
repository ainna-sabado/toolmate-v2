import type { Metadata } from "next";
import "./globals.css";
import { DepartmentProvider } from "@/context/DepartmentContext";
import AppShell from "@/components/layout/AppShell";

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
        </DepartmentProvider>
      </body>
    </html>
  );
}
