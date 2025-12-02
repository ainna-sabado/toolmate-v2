import { Tool } from "@/lib/models/Tool.model";
import { ToolKit } from "@/lib/models/ToolKit.model";
import {
  AuditCycle,
  type AuditCycleStatus,
} from "@/lib/models/AuditCycle.model";
import { calculateAuditProgressPercent } from "@/lib/helpers/auditProgress";

export type StorageDashboardRow = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType: string;

  storageUnitsCount: number; // e.g. "3 drawers" (unique qrLocation)

  // 👇 NEW: explicit breakdown
  individualToolsTotal: number;
  toolkitsTotal: number;

  // 👇 TOTAL audit units (tools + toolkits)
  toolsTotal: number;
  toolsChecked: number;
  progressPercent: number;

  auditStatus: AuditCycleStatus;
  cycleNumber: number | null;
  maxCycles: number | null;
  nextAuditDate: Date | null;
};

export default class AuditDashboardService {
  static async getStorageDashboard(
    mainDepartment?: string
  ): Promise<StorageDashboardRow[]> {
    const match: any = {};
    if (mainDepartment) match.mainDepartment = mainDepartment;

    // 1) Aggregate INDIVIDUAL tools
    const toolAgg = await Tool.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            mainDepartment: "$mainDepartment",
            mainStorageName: "$mainStorageName",
            mainStorageCode: "$mainStorageCode",
            storageType: "$storageType",
          },
          individualToolsTotal: { $sum: 1 },
          // treat anything not "pending" as checked
          individualToolsChecked: {
            $sum: {
              $cond: [{ $ne: ["$auditStatus", "pending"] }, 1, 0],
            },
          },
          qrLocations: { $addToSet: "$qrLocation" },
        },
      },
    ]);

    // 2) Aggregate TOOLKITS
    const kitAgg = await ToolKit.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            mainDepartment: "$mainDepartment",
            mainStorageName: "$mainStorageName",
            mainStorageCode: "$mainStorageCode",
            storageType: "$storageType",
          },
          toolkitsTotal: { $sum: 1 },

          // 🔑 Only count toolkit as "checked" if its own audit is COMPLETED
          toolkitsChecked: {
            $sum: {
              $cond: [{ $eq: ["$auditStatus", "completed"] }, 1, 0],
            },
          },

          qrLocations: { $addToSet: "$qrLocation" },
        },
      },
    ]);

    // Early exit
    if ((!toolAgg || toolAgg.length === 0) && (!kitAgg || kitAgg.length === 0)) {
      return [];
    }

    // Helper: build key
    const storageKey = (g: any) =>
      `${g._id.mainDepartment}::${g._id.mainStorageName}::${g._id.mainStorageCode}`;

    // Index the aggregates
    const toolMap = new Map<string, any>();
    for (const g of toolAgg as any[]) {
      toolMap.set(storageKey(g), g);
    }

    const kitMap = new Map<string, any>();
    for (const g of kitAgg as any[]) {
      kitMap.set(storageKey(g), g);
    }

    const allKeys = new Set<string>([
      ...toolMap.keys(),
      ...kitMap.keys(),
    ]);

    // 3) Load AuditCycle per storage
    const storageKeyParts = Array.from(allKeys).map((key) => {
      const [mainDepartment, mainStorageName, mainStorageCode] = key.split("::");
      return { mainDepartment, mainStorageName, mainStorageCode };
    });

    const cycles = await AuditCycle.find({
      $or: storageKeyParts.map((k) => ({
        mainDepartment: k.mainDepartment,
        mainStorageName: k.mainStorageName,
        mainStorageCode: k.mainStorageCode,
      })),
    }).lean();

    const cycleKey = (k: {
      mainDepartment: string;
      mainStorageName: string;
      mainStorageCode: string;
    }) => `${k.mainDepartment}::${k.mainStorageName}::${k.mainStorageCode}`;

    const cycleMap = new Map<string, (typeof cycles)[number]>();
    for (const c of cycles) {
      cycleMap.set(
        cycleKey({
          mainDepartment: c.mainDepartment,
          mainStorageName: c.mainStorageName,
          mainStorageCode: c.mainStorageCode,
        }),
        c
      );
    }

    const now = new Date();
    const rows: StorageDashboardRow[] = [];

    for (const key of allKeys) {
      const toolG = toolMap.get(key);
      const kitG = kitMap.get(key);

      const [mainDepartment, mainStorageName, mainStorageCode] = key.split("::");
      const storageType =
        toolG?._id?.storageType || kitG?._id?.storageType || "";

      const individualToolsTotal = toolG?.individualToolsTotal ?? 0;
      const individualToolsChecked = toolG?.individualToolsChecked ?? 0;

      const toolkitsTotal = kitG?.toolkitsTotal ?? 0;
      const toolkitsChecked = kitG?.toolkitsChecked ?? 0;

      // 👇 This is your “total tools” = tools + kits
      const toolsTotal = individualToolsTotal + toolkitsTotal;

      // 👇 Checked = checked tools + completed toolkits
      const toolsChecked = individualToolsChecked + toolkitsChecked;

      const progressPercent = calculateAuditProgressPercent(
        toolsChecked,
        toolsTotal
      );

      // Merge qr locations from tools + toolkits, de-duplicate
      const qrFromTools = Array.isArray(toolG?.qrLocations)
        ? toolG.qrLocations
        : [];
      const qrFromKits = Array.isArray(kitG?.qrLocations)
        ? kitG.qrLocations
        : [];
      const qrLocationsSet = new Set<string>([
        ...qrFromTools,
        ...qrFromKits,
      ]);
      const storageUnitsCount = qrLocationsSet.size;

      const cycle = cycleMap.get(key);

      // derive a sensible status
      let auditStatus: AuditCycleStatus =
        (cycle?.status as AuditCycleStatus) ?? "not_started";

      if (toolsChecked > 0 && toolsChecked < toolsTotal) {
        auditStatus = "in_progress";
      } else if (toolsTotal > 0 && toolsChecked === toolsTotal) {
        auditStatus = "completed";
      }

      if (
        cycle?.nextAuditDate &&
        new Date(cycle.nextAuditDate) < now &&
        auditStatus !== "completed"
      ) {
        auditStatus = "overdue";
      }

      rows.push({
        mainDepartment,
        mainStorageName,
        mainStorageCode,
        storageType,

        storageUnitsCount,

        individualToolsTotal,
        toolkitsTotal,

        toolsTotal,
        toolsChecked,
        progressPercent,

        auditStatus,
        cycleNumber: cycle?.cycleNumber ?? null,
        maxCycles: cycle?.maxCycles ?? null,
        nextAuditDate: cycle?.nextAuditDate ?? null,
      });
    }

    // Stable ordering
    rows.sort((a, b) => a.mainStorageName.localeCompare(b.mainStorageName));

    return rows;
  }
}
