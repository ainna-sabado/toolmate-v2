"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-56 border-r bg-white p-4 space-y-4">
      <nav className="flex flex-col gap-3 text-sm">
        <Link href="/issue-tools">Issue Tools</Link>
        <Link href="/return-tools">Return Tools</Link>
        <Link href="/run-audit">Run Audit</Link>
        <Link href="/dashboard">Dashboard</Link>

        {/* Newly added pages */}
        <Link href="/tools">Tools</Link>
        <Link href="/toolkits">ToolKits</Link>

        <Link href="/shadowboards">Shadowboards</Link>
        <Link href="/reports">Reports</Link>
      </nav>
    </aside>
  );
}
