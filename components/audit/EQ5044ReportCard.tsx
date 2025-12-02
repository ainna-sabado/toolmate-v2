// components/audit/EQ5044ReportCard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

type Props = {
  mainStorageName: string;
  mainStorageCode: string;
};

export default function EQ5044ReportCard({
  mainStorageName,
  mainStorageCode,
}: Props) {
  // Later you can wire this to your existing ReportSection/print flow
  const handleOpenReport = () => {
    // e.g. open a modal or navigate to /reports/eq5044?...
    // For now, this is a placeholder.
    window.print?.();
  };

  return (
    <div className="rounded-xl border bg-white p-4 flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-semibold">
          EQ5044 Tool Inventory Check
        </h2>
        <p className="text-xs text-gray-500">
          Storage: {mainStorageName} · Code: {mainStorageCode}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-fit gap-1 text-xs"
        onClick={handleOpenReport}
      >
        <Printer className="w-3 h-3" />
        Open / print report
      </Button>
    </div>
  );
}
