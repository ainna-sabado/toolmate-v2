"use client";

import Link from "next/link";
import { X } from "lucide-react";

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* BACKDROP */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* DRAWER */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-md z-50
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-4 text-sm">
          <Link href="/issue-tools" onClick={onClose}>Issue Tools</Link>
          <Link href="/return-tools" onClick={onClose}>Return Tools</Link>
          <Link href="/run-audit" onClick={onClose}>Run Audit</Link>
          <Link href="/dashboard" onClick={onClose}>Dashboard</Link>

          <hr className="my-2" />

          {/* NEW */}
          <Link href="/tools" onClick={onClose}>Tools</Link>
          <Link href="/toolkits" onClick={onClose}>ToolKits</Link>
          <Link href="/shadowboards" onClick={onClose}>Shadowboards</Link>
          <Link href="/reports" onClick={onClose}>Reports</Link>
        </nav>
      </aside>
    </>
  );
}
