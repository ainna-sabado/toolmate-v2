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

              {/* MAIN CONTENT AREA */}
              <main className="flex-1 overflow-y-auto">
                {/* GLOBAL RESPONSIVE WRAPPER */}
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                  {children}
                </div>
              </main>

              <Footer />
            </div>
          </div>
        </DepartmentProvider>
      </body>
    </html>
  );
}
