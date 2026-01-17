"use client";

import React from "react";

type StatusKind = "status" | "audit";

interface StatusBadgeProps {
  value?: string | null;
  kind?: StatusKind; // "status" (tool/toolkit) or "audit"
}

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getStatusClasses(value: string) {
  switch (value) {
    case "available":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "in use":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "for calibration":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "maintenance":
      return "bg-indigo-100 text-indigo-800 border border-indigo-200";
    case "damaged":
    case "lost":
    case "expired":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
}

function getAuditClasses(value: string) {
  switch (value) {
    case "present":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "needsupdate":
    case "needs update":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "pending":
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  value,
  kind = "status",
}) => {
  const normalized = normalize(value);
  if (!normalized) return null;

  const label = titleCase(normalized);

  const colorClasses =
    kind === "audit"
      ? getAuditClasses(normalized)
      : getStatusClasses(normalized);

  const baseClasses =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";

  return <span className={`${baseClasses} ${colorClasses}`}>{label}</span>;
};
