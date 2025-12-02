export function calculateAuditProgressPercent(
  toolsChecked: number,
  toolsTotal: number
): number {
  if (!toolsTotal || toolsTotal <= 0) return 0;
  const raw = (toolsChecked / toolsTotal) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
