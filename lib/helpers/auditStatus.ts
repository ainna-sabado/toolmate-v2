import type { AuditCycleStatus } from "@/lib/models/AuditCycle.model";

export type AuditStatusConfig = {
  label: string;
  className: string; // Tailwind classes for badge
};

export function getAuditStatusConfig(
  status: AuditCycleStatus | undefined | null
): AuditStatusConfig {
  switch (status) {
    case "in_progress":
      return {
        label: "In progress",
        className: "bg-blue-50 text-blue-700 border border-blue-200",
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    case "overdue":
      return {
        label: "Overdue",
        className: "bg-red-50 text-red-700 border border-red-200",
      };
    case "not_started":
    default:
      return {
        label: "Not started",
        className: "bg-gray-50 text-gray-600 border border-gray-200",
      };
  }
}
