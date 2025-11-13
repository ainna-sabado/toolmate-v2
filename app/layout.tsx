import type { Metadata } from "next";
import "./globals.css";
import { DepartmentProvider } from "@/context/DepartmentContext";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

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
          <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <div className="flex flex-col flex-1">
              <Header />

              <main className="flex-1 p-4 overflow-y-auto">{children}</main>

              <Footer />
            </div>
          </div>
        </DepartmentProvider>
      </body>
    </html>
  );
}
