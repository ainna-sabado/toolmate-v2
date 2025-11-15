"use client";

import { useState } from "react";
import Link from "next/link";
import { useDepartment } from "@/context/DepartmentContext";
import { Menu, Settings } from "lucide-react";
import DepartmentSelector from "./DepartmentSelector";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { mainDepartment } = useDepartment();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header
        className="
          fixed top-0 left-0 right-0 z-30 
          border-b bg-white px-4 py-3 
          flex flex-col 
          md:flex-row md:items-center md:justify-between
          gap-2 md:gap-0
        "
      >
        {/* LEFT SECTION — hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md border hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/">
            <h1 className="text-lg md:text-xl font-bold hover:text-blue-600 transition cursor-pointer">
              ToolMate
            </h1>
          </Link>
        </div>

        {/* RIGHT SECTION — Dept + Settings */}
        <div className="flex items-center gap-3 md:gap-4 justify-end">
          {mainDepartment && (
            <span
              className="
                px-3 py-1 rounded-md text-sm font-medium bg-gray-200 
                md:order-0
              "
            >
              {mainDepartment}
            </span>
          )}

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <DepartmentSelector open={settingsOpen} setOpen={setSettingsOpen} />
    </>
  );
}
