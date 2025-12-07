// components/audit/EQ5044ReportCard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown } from "lucide-react";

// ----------------------------
// Types matching the service
// ----------------------------

type Eq5044AuditColumn = {
  id: string;
  date: string; // ISO date
  label: string; // e.g. "#3 – 07/11/25"
  cycleNumber: number | null;
};

type Eq5044ItemHistoryRow = {
  rowType: "tool" | "toolkit" | "kitContent";
  id: string;
  parentKitId?: string;

  description: string;
  eqNumber?: string;
  qty: number;

  // snapshotId -> checked?
  history: Record<string, boolean>;
};

type Eq5044LocationSection = {
  qrLocation: string;
  items: Eq5044ItemHistoryRow[];
};

type StatusCounts = Record<string, number>;

type Eq5044ReportHeader = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType: string;
};

type Eq5044ReportSummary = {
  totalTools: number;
  toolsAudited: number;
  remainingTools: number;
  completionPercent: number;

  individualToolsTotal: number;
  toolkitsTotal: number;

  statusCounts: StatusCounts;
};

type Eq5044AuditMeta = {
  cycleNumber: number | null;
  maxCycles: number | null;
  auditStatus: string;
  nextAuditDate: string | null;
};

type Eq5044Report = {
  header: Eq5044ReportHeader;
  summary: Eq5044ReportSummary;
  auditMeta: Eq5044AuditMeta;
  columns: Eq5044AuditColumn[]; // one checkbox column per audit snapshot
  generatedAt: string;
  locations: Eq5044LocationSection[];
};

type Props = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  onBack: () => void;
};

export default function EQ5044ReportCard({
  mainDepartment,
  mainStorageName,
  mainStorageCode,
  onBack,
}: Props) {
  const [report, setReport] = useState<Eq5044Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref for the *printable* content: from header down to footer
  const printRef = useRef<HTMLDivElement | null>(null);

  // ----------------------------
  // Load report from API
  // ----------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          mainDepartment,
          mainStorageName,
          mainStorageCode,
        });

        const res = await fetch(
          `/api/dashboard/eq5044-report?${params.toString()}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load EQ5044 report.");
        }

        setReport(data as Eq5044Report);
      } catch (err: any) {
        console.error("EQ5044 report fetch error:", err);
        setError(err?.message ?? "Failed to load EQ5044 report.");
      } finally {
        setLoading(false);
      }
    };

    if (mainDepartment && mainStorageName && mainStorageCode) {
      load();
    } else {
      setError("Missing department or storage details for EQ5044 report.");
      setLoading(false);
    }
  }, [mainDepartment, mainStorageName, mainStorageCode]);

  // ----------------------------
  // Export (header → footer) as PDF
  // ----------------------------
  const handleExportPdf = () => {
    if (typeof window === "undefined") return;
    if (!printRef.current) return;

    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          ${document.head.innerHTML}
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              background: white;
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="p-4 print:p-0">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ----------------------------
  // Loading / error states
  // ----------------------------
  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-4 text-xs text-gray-500">
        Loading EQ5044 report…
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-3 rounded-lg border bg-white p-4 text-xs">
        <div className="text-red-600">
          {error || "Unable to load EQ5044 report."}
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back
        </Button>
      </div>
    );
  }

  // ----------------------------
  // Render report
  // ----------------------------
  const { header, summary, auditMeta } = report;
  const columns: Eq5044AuditColumn[] = report.columns ?? [];
  const locations: Eq5044LocationSection[] = report.locations ?? [];

  const generatedDate = new Date(report.generatedAt);
  const completion = Math.round(summary?.completionPercent ?? 0);
  const nextAuditDisplay = auditMeta?.nextAuditDate
    ? new Date(auditMeta.nextAuditDate).toLocaleDateString()
    : "";

  const hasColumns = columns.length > 0;

  // Column width setup for uniform tables
  const descWidth = 45;
  const eqWidth = 18;
  const qtyWidth = 7;
  const remainingWidth = 100 - descWidth - eqWidth - qtyWidth; // 30%
  const auditColWidth =
    hasColumns && columns.length > 0
      ? remainingWidth / columns.length
      : remainingWidth;

  // Supervisor sign-off only required on every 6th snapshot
  const isSupervisorRequiredForColumn = (col: Eq5044AuditColumn) =>
    col.cycleNumber !== null && col.cycleNumber % 6 === 0;

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 text-xs text-gray-900 print:border-0 print:p-0 print:bg-white">
      {/* Controls (hidden on print/export content) */}
      <div className="mb-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back
          </Button>
        </div>
        <Button size="sm" onClick={handleExportPdf}>
          <FileDown className="mr-1 h-3 w-3" />
          Export PDF
        </Button>
      </div>

      {/* EVERYTHING from here down (header → footer) goes into PDF */}
      <div ref={printRef} className="space-y-4">
        {/* Report header block – centered logo + doc number */}
        <header className="rounded-md border bg-gray-50 px-4 py-4">
          {/* Logo + title + doc number */}
          <div className="flex flex-col items-center gap-2 text-center">
            <img
              src="/airnz_logo.png"
              alt="Company Logo"
              className="h-10 w-auto object-contain print:h-8"
            />
            <div>
              <h1 className="text-sm font-semibold tracking-wide">
                TOOL INVENTORY CONTROL
              </h1>
              <p className="text-[10px] text-gray-600">
                <span className="font-medium">EQ5044 Rev 07</span>
              </p>
            </div>
          </div>

          {/* Storage + audit meta info */}
          <div
            className="mt-3 
              grid gap-x-6 gap-y-1 
              text-[11px] text-gray-700 items-center text-center"
          >
            <div className="space-y-0.5">
              <p>
                Department:{" "}
                <span className="font-medium">{header.mainDepartment}</span>
              </p>
              <p>
                Main storage:{" "}
                <span className="font-medium">{header.mainStorageName}</span> (
                <span className="font-mono">{header.mainStorageCode}</span>)
              </p>
              <p>
                Storage type:{" "}
                <span className="font-medium">{header.storageType || "—"}</span>
              </p>
            </div>
          </div>
        </header>

        {/* Summary section */}
        <section className="grid gap-3 border-b pb-3 text-[11px] md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
              Inventory summary
            </p>
            <p>
              Total tools &amp; kits:{" "}
              <span className="font-medium">{summary.totalTools}</span>
            </p>
            <p>
              Audited (current cycle):{" "}
              <span className="font-medium">{summary.toolsAudited}</span>
            </p>
            <p>
              Remaining:{" "}
              <span className="font-medium">{summary.remainingTools}</span>
            </p>
            <p>
              Completion: <span className="font-medium">{completion}%</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
              Breakdown
            </p>
            <p>
              Individual tools:{" "}
              <span className="font-medium">
                {summary.individualToolsTotal}
              </span>
            </p>
            <p>
              Toolkits:{" "}
              <span className="font-medium">{summary.toolkitsTotal}</span>
            </p>
            <p>
              Audit runs shown:{" "}
              <span className="font-medium">{columns.length}</span>
            </p>
          </div>

          <div className="space-y-0.5 text-left">
            <p>
              Cycle:{" "}
              <span className="font-medium">{auditMeta.cycleNumber ?? "—"}</span>
              {auditMeta.maxCycles ? ` / ${auditMeta.maxCycles}` : ""}
            </p>
            <p>
              Status:{" "}
              <span className="font-medium capitalize">
                {auditMeta.auditStatus.replace("_", " ")}
              </span>
            </p>
            <p>
              Next audit due:{" "}
              <span className="font-medium">{nextAuditDisplay || "—"}</span>
            </p>
            <p>
              Generated:{" "}
              <span className="font-medium">
                {generatedDate.toLocaleDateString()}{" "}
                {generatedDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </section>

        {/* Per-QR location sections */}
        {locations.map((loc) => {
          const toolItems = loc.items.filter(
            (item) => item.rowType === "tool"
          );
          const toolkitItems = loc.items.filter(
            (item) => item.rowType === "toolkit" || item.rowType === "kitContent"
          );

          const showSignoffOnToolsTable =
            toolItems.length > 0 && toolkitItems.length === 0;
          const showSignoffOnToolkitsTable = toolkitItems.length > 0;

          return (
            <section
              key={loc.qrLocation}
              className="mt-4 break-inside-avoid-page rounded-md border px-3 py-2"
            >
              {/* Location header */}
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                  {loc.qrLocation}
                </h2>
                {hasColumns && (
                  <p className="text-[10px] text-gray-500">
                    Columns: audit snapshots in chronological order
                  </p>
                )}
              </div>

              {/* Individual tools table */}
              {toolItems.length > 0 && (
                <div className="mt-1">
                  <table className="w-full table-fixed border-collapse text-[11px]">
                    <colgroup>
                      <col style={{ width: `${descWidth}%` }} />
                      <col style={{ width: `${eqWidth}%` }} />
                      <col style={{ width: `${qtyWidth}%` }} />
                      {hasColumns ? (
                        columns.map((col) => (
                          <col
                            key={col.id}
                            style={{ width: `${auditColWidth}%` }}
                          />
                        ))
                      ) : (
                        <col style={{ width: `${remainingWidth}%` }} />
                      )}
                    </colgroup>
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="border px-1 py-1 text-left align-top whitespace-normal break-words">
                          INDIVIDUAL TOOLS
                        </th>
                        <th className="border px-1 py-1 text-left align-top whitespace-normal break-words">
                          EQ No.
                        </th>
                        <th className="border px-1 py-1 text-right align-top whitespace-normal break-words">
                          Qty
                        </th>
                        {hasColumns ? (
                          columns.map((col) => (
                            <th
                              key={col.id}
                              className="border px-1 py-1 text-center align-top whitespace-normal break-words"
                            >
                              <span className="block leading-tight">
                                {col.label}
                              </span>
                            </th>
                          ))
                        ) : (
                          <th className="border px-1 py-1 text-center align-top whitespace-normal break-words">
                            Audit history
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {toolItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                          }
                        >
                          <td className="border px-1 py-1 align-top whitespace-normal break-words">
                            {item.description}
                          </td>
                          <td className="border px-1 py-1 align-top font-mono whitespace-normal break-words">
                            {item.eqNumber || "—"}
                          </td>
                          <td className="border px-1 py-1 text-right align-top whitespace-normal break-words">
                            {item.qty}
                          </td>
                          {hasColumns ? (
                            columns.map((col) => {
                              const checked = item.history[col.id] ?? false;
                              return (
                                <td
                                  key={col.id}
                                  className="border px-1 py-1 text-center align-middle"
                                >
                                  <span className="inline-block text-base leading-none">
                                    {checked ? "☑" : "☐"}
                                  </span>
                                </td>
                              );
                            })
                          ) : (
                            <td className="border px-1 py-1 text-center">
                              —
                            </td>
                          )}
                        </tr>
                      ))}

                      {/* If there are no toolkits, show sign-off rows here */}
                      {showSignoffOnToolsTable && (
                        <>
                          {/* Audit completed by row (always available) */}
                          <tr>
                            <td
                              className="border px-1 py-2 text-[11px] whitespace-normal break-words"
                              colSpan={3}
                            >
                              Audit completed by (Name / ID):
                            </td>
                            {hasColumns ? (
                              columns.map((col) => (
                                <td
                                  key={col.id}
                                  className="border px-1 py-2"
                                >
                                  &nbsp;
                                </td>
                              ))
                            ) : (
                              <td className="border px-1 py-2">&nbsp;</td>
                            )}
                          </tr>

                          {/* Supervisor row – only 6th snapshots active */}
                          <tr>
                            <td
                              className="border px-1 py-2 text-[11px] whitespace-normal break-words"
                              colSpan={3}
                            >
                              Supervisor / Team Head (Name / ID):
                            </td>
                            {hasColumns ? (
                              columns.map((col) => {
                                const required =
                                  isSupervisorRequiredForColumn(col);
                                return (
                                  <td
                                    key={col.id}
                                    className={
                                      "border px-1 py-2 " +
                                      (required
                                        ? ""
                                        : "bg-gray-200 text-gray-400 print:bg-gray-200")
                                    }
                                  >
                                    &nbsp;
                                  </td>
                                );
                              })
                            ) : (
                              <td className="border px-1 py-2">&nbsp;</td>
                            )}
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Toolkits + contents table */}
              {toolkitItems.length > 0 && (
                <div className="mt-3">
                  <table className="w-full table-fixed border-collapse text-[11px]">
                    <colgroup>
                      <col style={{ width: `${descWidth}%` }} />
                      <col style={{ width: `${eqWidth}%` }} />
                      <col style={{ width: `${qtyWidth}%` }} />
                      {hasColumns ? (
                        columns.map((col) => (
                          <col
                            key={col.id}
                            style={{ width: `${auditColWidth}%` }}
                          />
                        ))
                      ) : (
                        <col style={{ width: `${remainingWidth}%` }} />
                      )}
                    </colgroup>
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="border px-1 py-1 text-left align-top whitespace-normal break-words">
                          TOOLKITS
                        </th>
                        <th className="border px-1 py-1 text-left align-top whitespace-normal break-words">
                          EQ No.
                        </th>
                        <th className="border px-1 py-1 text-right align-top whitespace-normal break-words">
                          Qty
                        </th>
                        {hasColumns ? (
                          columns.map((col) => (
                            <th
                              key={col.id}
                              className="border px-1 py-1 text-center align-top whitespace-normal break-words"
                            >
                              <span className="block leading-tight">
                                {col.label}
                              </span>
                            </th>
                          ))
                        ) : (
                          <th className="border px-1 py-1 text-center align-top whitespace-normal break-words">
                            Audit history
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {toolkitItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                          }
                        >
                          <td className="border px-1 py-1 align-top whitespace-normal break-words">
                            {item.rowType === "kitContent" ? (
                              <span className="pl-3">
                                • {item.description}
                              </span>
                            ) : (
                              <span className="font-medium">
                                {item.description}
                              </span>
                            )}
                          </td>
                          <td className="border px-1 py-1 align-top font-mono whitespace-normal break-words">
                            {item.eqNumber || "—"}
                          </td>
                          <td className="border px-1 py-1 text-right align-top whitespace-normal break-words">
                            {item.qty}
                          </td>
                          {hasColumns ? (
                            columns.map((col) => {
                              const checked = item.history[col.id] ?? false;
                              return (
                                <td
                                  key={col.id}
                                  className="border px-1 py-1 text-center align-middle"
                                >
                                  <span className="inline-block text-base leading-none">
                                    {checked ? "☑" : "☐"}
                                  </span>
                                </td>
                              );
                            })
                          ) : (
                            <td className="border px-1 py-1 text-center">
                              —
                            </td>
                          )}
                        </tr>
                      ))}

                      {/* Sign-off rows for this location when toolkits exist */}
                      {showSignoffOnToolkitsTable && (
                        <>
                          {/* Audit completed by row (always available) */}
                          <tr>
                            <td
                              className="border px-1 py-2 text-[11px] whitespace-normal break-words"
                              colSpan={3}
                            >
                              Audit completed by (Name / ID):
                            </td>
                            {hasColumns ? (
                              columns.map((col) => (
                                <td
                                  key={col.id}
                                  className="border px-1 py-2"
                                >
                                  &nbsp;
                                </td>
                              ))
                            ) : (
                              <td className="border px-1 py-2">&nbsp;</td>
                            )}
                          </tr>

                          {/* Supervisor row – only 6th snapshots active */}
                          <tr>
                            <td
                              className="border px-1 py-2 text-[11px] whitespace-normal break-words"
                              colSpan={3}
                            >
                              Supervisor / Team Head (Name / ID):
                            </td>
                            {hasColumns ? (
                              columns.map((col) => {
                                const required =
                                  isSupervisorRequiredForColumn(col);
                                return (
                                  <td
                                    key={col.id}
                                    className={
                                      "border px-1 py-2 " +
                                      (required
                                        ? ""
                                        : "bg-gray-200 text-gray-400 print:bg-gray-200")
                                    }
                                  >
                                    &nbsp;
                                  </td>
                                );
                              })
                            ) : (
                              <td className="border px-1 py-2">&nbsp;</td>
                            )}
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* If no items at all */}
              {toolItems.length === 0 && toolkitItems.length === 0 && (
                <div className="mt-1 text-center text-[11px] text-gray-500">
                  No tools or toolkits recorded at this location.
                </div>
              )}
            </section>
          );
        })}

        {/* Footer note for print */}
        <footer className="mt-4 border-t pt-2 text-[10px] text-gray-500 print:text-[9px]">
          This report is generated from ToolMate and reflects the audit history
          for the selected main storage. Supervisor sign-off is required on every
          6th snapshot per storage location. Greyed-out supervisor cells indicate
          sign-off is not required for those audit runs.
        </footer>
      </div>
    </div>
  );
}
