const VALID_STATUSES = ["present", "needsUpdate", "pending"];

export function validateAuditStatus(status?: string) {
  if (!status) return;

  if (!VALID_STATUSES.includes(status)) {
    throw new Error(
      `Invalid auditStatus "${status}". Allowed: ${VALID_STATUSES.join(", ")}`
    );
  }
}
