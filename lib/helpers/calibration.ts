// lib/helpers/calibration.ts

// TODO: later this can come from DB / admin settings
export const DEFAULT_CAL_THRESHOLD_DAYS = 7;

/**
 * Returns true if a calibration date is within thresholdDays (or overdue).
 * Accepts Date or ISO string.
 */
export function isCalibrationDue(
  date: Date | string | null | undefined,
  thresholdDays: number = DEFAULT_CAL_THRESHOLD_DAYS
): boolean {
  if (!date) return false;

  const dueDate = new Date(date);
  if (Number.isNaN(dueDate.getTime())) return false;

  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // “Within 7 days” also includes any date in the past
  return diffDays <= thresholdDays;
}

/**
 * Tools / Toolkits: returns the *effective* status
 * If calibration is due soon ⇒ "for calibration" (overrides any base status).
 */
export function getEffectiveStatus(
  baseStatus: string | null | undefined,
  calibrationDate: Date | string | null | undefined,
  thresholdDays: number = DEFAULT_CAL_THRESHOLD_DAYS
): string {
  if (isCalibrationDue(calibrationDate, thresholdDays)) {
    return "for calibration";
  }
  return baseStatus || "available";
}

/**
 * For toolkits: checks if ANY kit content is due for calibration.
 * contents must have a calDate field (from KitContentSchema).
 */
export function isAnyKitContentDue(
  contents: Array<{ calDate?: Date | string | null }> | undefined,
  thresholdDays: number = DEFAULT_CAL_THRESHOLD_DAYS
): boolean {
  if (!contents || contents.length === 0) return false;
  return contents.some((item) => isCalibrationDue(item.calDate, thresholdDays));
}
