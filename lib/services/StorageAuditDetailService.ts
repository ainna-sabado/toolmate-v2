// lib/services/StorageAuditDetailService.ts
import { Tool } from "@/lib/models/Tool.model";
import { ToolKit } from "@/lib/models/ToolKit.model";
import {
  AuditCycle,
  type AuditCycleStatus,
} from "@/lib/models/AuditCycle.model";
import { calculateAuditProgressPercent } from "@/lib/helpers/auditProgress";

export type StatusKey =
  | "available"
  | "in use"
  | "for calibration"
  | "damaged"
  | "lost"
  | "maintenance"
  | "expired";

export type StatusCounts = Record<StatusKey, number>;

export type QrLocationProgress = {
  qrLocation: string;
  totalUnits: number; // tools + kits
  auditedUnits: number; // checked tools + completed kits
  percent: number;
};

export type ToolkitPendingItem = {
  id: string;
  name: string;
  qrCode: string;
  auditStatus: string;
  contentsCount: number;
};

export type ToolkitsSummary = {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  pendingItems: ToolkitPendingItem[];
};

export type StorageDetail = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType: string;

  auditStatus: AuditCycleStatus;
  cycleNumber: number | null;
  maxCycles: number | null;
  nextAuditDate: Date | null;

  // counts
  totalTools: number; // tools + kits
  toolsAudited: number; // checked tools + completed kits
  remainingTools: number;
  completionPercent: number;

  individualToolsTotal: number;
  toolkitsTotal: number;

  statusCounts: StatusCounts;
  toolkitsSummary: ToolkitsSummary;
  qrLocations: QrLocationProgress[];
};

function emptyStatusCounts(): StatusCounts {
  return {
    available: 0,
    "in use": 0,
    "for calibration": 0,
    damaged: 0,
    lost: 0,
    maintenance: 0,
    expired: 0,
  };
}

export default class StorageAuditDetailService {
  static async getStorageDetail(params: {
    mainDepartment: string;
    mainStorageName: string;
    mainStorageCode: string;
  }): Promise<StorageDetail | null> {
    const { mainDepartment, mainStorageName, mainStorageCode } = params;

    const match = {
      mainDepartment,
      mainStorageName,
      mainStorageCode,
    };

    // 1) Load tools + kits for this storage
    const [tools, toolkits, cycle] = await Promise.all([
      Tool.find(match).lean(),
      ToolKit.find(match).lean(),
      AuditCycle.findOne(match).lean(),
    ]);

    if (!tools.length && !toolkits.length) {
      return null;
    }

    // 2) Status distribution (tools + kits together)
    const statusCounts = emptyStatusCounts();

    const bumpStatus = (status: any) => {
      if (!status) return;
      if (statusCounts[status as StatusKey] !== undefined) {
        statusCounts[status as StatusKey] += 1;
      }
    };

    tools.forEach((t: any) => bumpStatus(t.status));
    toolkits.forEach((k: any) => bumpStatus(k.status));

    // 3) Unit counts
    const individualToolsTotal = tools.length;
    const toolkitsTotal = toolkits.length;

    // audited tools = tools where auditStatus != "pending"
    const auditedTools = tools.filter(
      (t: any) => t.auditStatus && t.auditStatus !== "pending"
    ).length;

    // audited kits = kits where auditStatus === "completed"
    const completedKitsArr = toolkits.filter(
      (k: any) => k.auditStatus === "completed"
    );
    const completedKits = completedKitsArr.length;

    const totalTools = individualToolsTotal + toolkitsTotal;
    const toolsAudited = auditedTools + completedKits;
    const remainingTools = Math.max(0, totalTools - toolsAudited);
    const completionPercent = calculateAuditProgressPercent(
      toolsAudited,
      totalTools
    );

    // 4) Toolkit summary
    const inProgressKitsArr = toolkits.filter(
      (k: any) => k.auditStatus === "in_progress"
    );
    const inProgressKits = inProgressKitsArr.length;

    const notStartedKitsArr = toolkits.filter(
      (k: any) =>
        !k.auditStatus ||
        k.auditStatus === "pending" ||
        k.auditStatus === "not_started"
    );
    const notStartedKits = notStartedKitsArr.length;

    // only list toolkits that are NOT completed
    const pendingItems = [...inProgressKitsArr, ...notStartedKitsArr].map(
      (k: any): ToolkitPendingItem => ({
        id: String(k._id),
        name: k.name || k.kitNumber || "Unnamed toolkit",
        qrCode: k.qrCode || "—",
        auditStatus: k.auditStatus || "pending",
        contentsCount: Array.isArray(k.contents) ? k.contents.length : 0,
      })
    );

    const toolkitsSummary: ToolkitsSummary = {
      total: toolkitsTotal,
      completed: completedKits,
      inProgress: inProgressKits,
      notStarted: notStartedKits,
      pendingItems,
    };

    // 5) QR locations progress
    const qrMap = new Map<string, { total: number; audited: number }>();

    const bumpQr = (qrLocation: string | undefined, isAuditedUnit: boolean) => {
      const key = qrLocation || "UNASSIGNED";
      const current = qrMap.get(key) || { total: 0, audited: 0 };
      current.total += 1;
      if (isAuditedUnit) current.audited += 1;
      qrMap.set(key, current);
    };

    tools.forEach((t: any) =>
      bumpQr(t.qrLocation, t.auditStatus && t.auditStatus !== "pending")
    );
    toolkits.forEach((k: any) =>
      bumpQr(k.qrLocation, k.auditStatus === "completed")
    );

    const qrLocations: QrLocationProgress[] = Array.from(qrMap.entries()).map(
      ([qrLocation, v]) => ({
        qrLocation,
        totalUnits: v.total,
        auditedUnits: v.audited,
        percent: calculateAuditProgressPercent(v.audited, v.total),
      })
    );

    qrLocations.sort((a, b) => a.qrLocation.localeCompare(b.qrLocation));

    // 6) Audit status derived
    const now = new Date();
    let auditStatus: AuditCycleStatus =
      (cycle?.status as AuditCycleStatus) ?? "not_started";

    if (toolsAudited > 0 && toolsAudited < totalTools) {
      auditStatus = "in_progress";
    } else if (totalTools > 0 && toolsAudited === totalTools) {
      auditStatus = "completed";
    }

    if (
      cycle?.nextAuditDate &&
      new Date(cycle.nextAuditDate) < now &&
      auditStatus !== "completed"
    ) {
      auditStatus = "overdue";
    }

    return {
      mainDepartment,
      mainStorageName,
      mainStorageCode,
      storageType:
        (tools[0]?.storageType as string) ||
        (toolkits[0]?.storageType as string) ||
        "",

      auditStatus,
      cycleNumber: cycle?.cycleNumber ?? null,
      maxCycles: cycle?.maxCycles ?? null,
      nextAuditDate: cycle?.nextAuditDate ?? null,

      totalTools,
      toolsAudited,
      remainingTools,
      completionPercent,

      individualToolsTotal,
      toolkitsTotal,

      statusCounts,
      toolkitsSummary,
      qrLocations,
    };
  }
}
