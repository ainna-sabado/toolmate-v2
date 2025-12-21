// lib/services/EQ5044ReportService.ts
import { Tool } from "@/lib/models/Tool.model";
import { ToolKit } from "@/lib/models/ToolKit.model";
import { AuditCycle } from "@/lib/models/AuditCycle.model";
import { AuditSnapshot } from "@/lib/models/AuditSnapshot.model";
import StorageAuditDetailService, {
  type StatusCounts,
} from "@/lib/services/StorageAuditDetailService";

// --------------------------------------------------
// Types
// --------------------------------------------------

export type Eq5044AuditColumn = {
  /** Unique id for this audit column (backed by AuditSnapshot _id) */
  id: string;
  /** ISO timestamp for this audit event */
  date: string;
  /** Human friendly label e.g. "Cycle 2 – 07/11/25" */
  label: string;
  /** Cycle number (1..6 etc) if available */
  cycleNumber: number | null;
};

export type Eq5044ItemHistoryRow = {
  rowType: "tool" | "toolkit" | "kitContent";
  id: string;
  parentKitId?: string;

  description: string;
  eqNumber?: string;
  qty: number;

  /**
   * Map of snapshotId -> whether this row was checked/present
   * for that audit snapshot.
   */
  history: Record<string, boolean>;
};

export type Eq5044LocationSection = {
  qrLocation: string;
  items: Eq5044ItemHistoryRow[];
};

export type Eq5044ReportHeader = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType: string;
};

export type Eq5044ReportSummary = {
  totalTools: number;
  toolsAudited: number;
  remainingTools: number;
  completionPercent: number;

  individualToolsTotal: number;
  toolkitsTotal: number;

  statusCounts: StatusCounts;
};

export type Eq5044AuditMeta = {
  cycleNumber: number | null;
  maxCycles: number | null;
  auditStatus: string;
  nextAuditDate: string | null;
};

export type Eq5044Report = {
  header: Eq5044ReportHeader;
  summary: Eq5044ReportSummary;
  auditMeta: Eq5044AuditMeta;
  /** Chronological list of audit snapshots turned into checkbox columns */
  columns: Eq5044AuditColumn[];
  generatedAt: string;
  locations: Eq5044LocationSection[];
};

type GetReportParams = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
};

// Limit how many historical columns we show in the grid (for print width)
const MAX_AUDIT_COLUMNS = 12;

// --------------------------------------------------
// Service
// --------------------------------------------------

export default class EQ5044ReportService {
  /**
   * Build a multi-cycle EQ5044 style report.
   *
   * Rows   = tools / toolkits / kit contents, grouped by qrLocation
   * Columns = audit snapshots (each real audit run)
   * Cell   = ☑ / ☐ (present in that audit or not)
   */
  static async getReport(params: GetReportParams): Promise<Eq5044Report | null> {
    const { mainDepartment, mainStorageName, mainStorageCode } = params;

    // 1) Base storage snapshot + counts from existing helper
    const detail = await StorageAuditDetailService.getStorageDetail({
      mainDepartment,
      mainStorageName,
      mainStorageCode,
    });

    if (!detail) {
      return null;
    }

    const match = {
      mainDepartment,
      mainStorageName,
      mainStorageCode,
    };

    // 2) Load current tools & toolkits for this storage
    const [tools, toolkits] = await Promise.all([
      Tool.find(match).lean(),
      ToolKit.find(match).lean(),
    ]);

    if (!tools.length && !toolkits.length) {
      // No live tools for this storage
      return null;
    }

    // 3) Prepare row containers grouped by qrLocation
    const locationMap = new Map<string, Eq5044LocationSection>();
    const rowMap = new Map<string, Eq5044ItemHistoryRow>();

    const ensureLocation = (
      qrLocation?: string | null
    ): Eq5044LocationSection => {
      const key = qrLocation || "UNASSIGNED";
      let section = locationMap.get(key);
      if (!section) {
        section = { qrLocation: key, items: [] };
        locationMap.set(key, section);
      }
      return section;
    };

    const makeRowKey = (
      kind: "tool" | "toolkit" | "kitContent",
      id: string,
      parentKitId?: string
    ) => {
      if (kind === "kitContent" && parentKitId) {
        return `${kind}:${parentKitId}:${id}`;
      }
      return `${kind}:${id}`;
    };

    // --- Individual tools (one row per tool) ---
    tools.forEach((t: any) => {
      const section = ensureLocation(t.qrLocation);
      const id = t._id.toString();
      const row: Eq5044ItemHistoryRow = {
        rowType: "tool",
        id,
        description: t.name,
        eqNumber: t.eqNumber || undefined,
        qty:
          typeof t.qty === "number" && !Number.isNaN(t.qty) && t.qty > 0
            ? t.qty
            : 1,
        history: {},
      };

      const key = makeRowKey("tool", id);
      rowMap.set(key, row);
      section.items.push(row);
    });

    // --- Toolkits + contents ---
    toolkits.forEach((k: any) => {
      const section = ensureLocation(k.qrLocation);
      const kitId = k._id.toString();

      // Toolkit row
      const kitRow: Eq5044ItemHistoryRow = {
        rowType: "toolkit",
        id: kitId,
        description: k.name,
        eqNumber: k.kitNumber || undefined,
        qty: 1,
        history: {},
      };

      rowMap.set(makeRowKey("toolkit", kitId), kitRow);
      section.items.push(kitRow);

      // Contents rows
      if (Array.isArray(k.contents)) {
        k.contents.forEach((c: any, index: number) => {
          const contentId =
            (c._id && c._id.toString && c._id.toString()) ||
            `${kitId}::${index}`;

          const contentRow: Eq5044ItemHistoryRow = {
            rowType: "kitContent",
            id: contentId,
            parentKitId: kitId,
            description: c.name,
            eqNumber: c.eqNumber || undefined,
            qty:
              typeof c.qty === "number" && !Number.isNaN(c.qty) && c.qty > 0
                ? c.qty
                : 1,
            history: {},
          };

          rowMap.set(
            makeRowKey("kitContent", contentId, kitId),
            contentRow
          );
          section.items.push(contentRow);
        });
      }
    });

    // 4) Load audit cycles + snapshots for this storage, turn them into columns
    const cycles = await AuditCycle.find(match)
      .select("_id cycleNumber")
      .lean();

    const cycleMetaById = new Map<
      string,
      {
        cycleNumber: number | null;
      }
    >();

    const cycleIds: string[] = [];
    for (const c of cycles) {
      const id = (c as any)._id.toString();
      cycleIds.push(id);
      cycleMetaById.set(id, {
        cycleNumber:
          typeof (c as any).cycleNumber === "number"
            ? (c as any).cycleNumber
            : null,
      });
    }

    let snapshots: any[] = [];
    if (cycleIds.length > 0) {
      snapshots = await AuditSnapshot.find({
        cycleId: { $in: cycleIds },
      })
        .sort({ snapshotDate: 1, createdAt: 1 })
        .lean();
    }

    // Only keep the most recent N snapshots to avoid an excessively wide printout
    if (snapshots.length > MAX_AUDIT_COLUMNS) {
      snapshots = snapshots.slice(-MAX_AUDIT_COLUMNS);
    }

    const columns: Eq5044AuditColumn[] = snapshots.map((snap: any) => {
      const snapId = snap._id.toString();
      const d: Date = snap.snapshotDate
        ? new Date(snap.snapshotDate)
        : new Date();

      const cycleMeta = cycleMetaById.get(
        snap.cycleId ? snap.cycleId.toString() : ""
      );

      const dateLabel = d.toLocaleDateString("en-NZ", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });

      const cycleLabel =
        cycleMeta && typeof cycleMeta.cycleNumber === "number"
          ? `Cycle ${cycleMeta.cycleNumber}`
          : "";

      return {
        id: snapId,
        date: d.toISOString(),
        label: cycleLabel ? `${cycleLabel} – ${dateLabel}` : dateLabel,
        cycleNumber: cycleMeta?.cycleNumber ?? null,
      };
    });

    // 5) Fill per-row history from each snapshot
    for (const snap of snapshots) {
      const snapId: string = snap._id.toString();

      // Tools
      const toolData: any[] = Array.isArray(snap.toolData) ? snap.toolData : [];
      for (const t of toolData) {
        if (!t || !t._id) continue;
        const id = t._id.toString();
        const key = makeRowKey("tool", id);
        const row = rowMap.get(key);
        if (!row) continue;

        const status = (t as any).auditStatus as string | undefined;
        row.history[snapId] = status === "present";
      }

      // Toolkits + contents
      const kitData: any[] = Array.isArray(snap.toolKitData)
        ? snap.toolKitData
        : [];

      for (const k of kitData) {
        if (!k || !k._id) continue;
        const kitId = k._id.toString();

        // Toolkit row
        {
          const key = makeRowKey("toolkit", kitId);
          const row = rowMap.get(key);
          if (row) {
            const status = (k as any).auditStatus as string | undefined;
            row.history[snapId] = status === "present";
          }
        }

        // Kit contents rows
        const contents: any[] = Array.isArray((k as any).contents)
          ? (k as any).contents
          : [];

        for (let index = 0; index < contents.length; index++) {
          const c = contents[index];
          if (!c) continue;

          const contentId =
            (c._id && c._id.toString && c._id.toString()) ||
            `${kitId}::${index}`;
          const key = makeRowKey("kitContent", contentId, kitId);
          const row = rowMap.get(key);
          if (!row) continue;

          const status = (c as any).auditStatus as string | undefined;
          row.history[snapId] = status === "present";
        }
      }
    }

    // 6) Convert map -> sorted array by qrLocation
    const locations: Eq5044LocationSection[] = Array.from(
      locationMap.values()
    ).sort((a, b) => a.qrLocation.localeCompare(b.qrLocation));

    // 7) Summary + audit meta (current cycle state)
    const summary: Eq5044ReportSummary = {
      totalTools: detail.totalTools,
      toolsAudited: detail.toolsAudited,
      remainingTools: detail.remainingTools,
      completionPercent: detail.completionPercent,
      individualToolsTotal: detail.individualToolsTotal,
      toolkitsTotal: detail.toolkitsTotal,
      statusCounts: detail.statusCounts,
    };

    const auditMeta: Eq5044AuditMeta = {
      cycleNumber: detail.cycleNumber,
      maxCycles: detail.maxCycles,
      auditStatus: detail.auditStatus,
      nextAuditDate: detail.nextAuditDate
        ? new Date(detail.nextAuditDate).toISOString()
        : null,
    };

    return {
      header: {
        mainDepartment: detail.mainDepartment,
        mainStorageName: detail.mainStorageName,
        mainStorageCode: detail.mainStorageCode,
        storageType: detail.storageType,
      },
      summary,
      auditMeta,
      columns,
      generatedAt: new Date().toISOString(),
      locations,
    };
  }
}
