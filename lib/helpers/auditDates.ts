export function formatNextAuditDate(input?: string | Date | null): string {
  if (!input) return "Not set";

  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NZ", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
