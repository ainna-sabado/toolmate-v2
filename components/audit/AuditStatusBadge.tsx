"use client";

import { getAuditStatusConfig } from "@/lib/helpers/auditStatus";
import type { AuditCycleStatus } from "@/lib/models/AuditCycle.model";

type Props = {
  status: AuditCycleStatus | null | undefined;
};

export default function AuditStatusBadge({ status }: Props) {
  const config = getAuditStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
