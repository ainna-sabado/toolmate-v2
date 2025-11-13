"use client";

import { useState } from "react";
import { useDepartment } from "@/context/DepartmentContext";
import { Settings } from "lucide-react";
import DepartmentSelector from "./DepartmentSelector";

export default function Header() {
  const { mainDepartment } = useDepartment();
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <header className="w-full border-b bg-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">ToolMate</h1>

        <div className="flex items-center gap-4">
          {mainDepartment && (
            <span className="px-3 py-1 bg-gray-200 rounded-md text-sm font-medium">
              {mainDepartment}
            </span>
          )}

          <button onClick={() => setOpen(true)}>
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <DepartmentSelector open={open} setOpen={setOpen} />
    </>
  );
}
