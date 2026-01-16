import { NextResponse } from "next/server";

import { connectDB } from "@/lib/config/db";
import { Shadowboard } from "@/lib/models/Shadowboard.model";
import { Tool } from "@/lib/models/Tool.model";
import { ToolKit } from "@/lib/models/ToolKit.model";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

type StorageHeader = {
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  storageType?: string;
  qrLocation: string;
  rowName?: string;
};

type ShadowboardPayload =
  | {
      _id: string;
      images: { url: string; label?: string; order: number }[];
      sequence: any[];
    }
  | null;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const type = (url.searchParams.get("type") || "storage").trim();
    if (type !== "storage") {
      return badRequest(
        "Only type=storage is supported by /api/audits/context right now."
      );
    }

    const mainDepartment = (url.searchParams.get("mainDepartment") || "").trim();
    const mainStorageName = (url.searchParams.get("mainStorageName") || "").trim();
    const mainStorageCode = (url.searchParams.get("mainStorageCode") || "").trim();
    const storageType = (url.searchParams.get("storageType") || "").trim() || undefined;
    const qrLocation = (url.searchParams.get("qrLocation") || "").trim();
    const rowName = (url.searchParams.get("rowName") || "").trim() || undefined;

    if (!mainDepartment || !mainStorageName || !mainStorageCode || !qrLocation) {
      return badRequest(
        "Missing required params. Expected: mainDepartment, mainStorageName, mainStorageCode, qrLocation (and optional rowName, storageType)."
      );
    }

    await connectDB();

    // Shadowboard (storage scope)
    // Try row/location shadowboard first, then fallback to storage-level (qrLocation: null)
    const sb =
      (await Shadowboard.findOne({
        scopeType: "storage",
        mainDepartment,
        mainStorageName,
        mainStorageCode,
        qrLocation, // row/location-level (if it exists)
      })
        .select({ images: 1, sequence: 1 })
        .lean()) ||
      (await Shadowboard.findOne({
        scopeType: "storage",
        mainDepartment,
        mainStorageName,
        mainStorageCode,
        qrLocation: null, // ✅ your current storage-level shadowboards
      })
        .select({ images: 1, sequence: 1 })
        .lean());

    const shadowboard: ShadowboardPayload = sb
      ? {
          _id: String(sb._id),
          images: (sb.images || [])
            .slice()
            .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
          sequence: sb.sequence || [],
        }
      : null;

    // Tools in this QR location (exclude tools that belong to a toolkit)
    const toolsRaw = await Tool.find({
      mainDepartment,
      mainStorageName,
      mainStorageCode,
      qrLocation,
      $or: [{ toolKitId: { $exists: false } }, { toolKitId: null }],
    })
      .select({
        name: 1,
        brand: 1,
        category: 1,
        eqNumber: 1,
        qty: 1,
        status: 1,
        dueDate: 1,
        auditStatus: 1,
      })
      .lean();

    let tools = (toolsRaw || []).map((t: any) => ({
      _id: String(t._id),
      name: t.name,
      brand: t.brand ?? "",
      category: t.category ?? "",
      eqNumber: t.eqNumber ?? "",
      qty: t.qty ?? 1,
      status: t.status,
      dueDate: t.dueDate,
      auditStatus: t.auditStatus,
    }));

    // Toolkits physically in this QR location
    const toolkitsRaw = await ToolKit.find({
      mainDepartment,
      mainStorageName,
      mainStorageCode,
      qrLocation,
    })
      .select({ name: 1, kitNumber: 1, auditStatus: 1 })
      .lean();

    let toolkits = (toolkitsRaw || []).map((k: any) => ({
      _id: String(k._id),
      name: k.name,
      kitNumber: k.kitNumber,
      auditStatus: k.auditStatus,
    }));

    // Optional ordering based on shadowboard.sequence
    if (shadowboard?.sequence?.length) {
      const orderMap = new Map<string, number>();
      for (const s of shadowboard.sequence as any[]) {
        if (s?.itemType === "tool" && s?.itemId) {
          orderMap.set(`tool:${String(s.itemId)}`, Number(s.order ?? 0));
        }
        if (s?.itemType === "toolkit" && s?.itemId) {
          orderMap.set(`toolkit:${String(s.itemId)}`, Number(s.order ?? 0));
        }
      }

      const withOrder = <T extends { _id: string }>(items: T[], prefix: "tool" | "toolkit") =>
        items
          .map((i) => ({ ...i, __order: orderMap.get(`${prefix}:${i._id}`) }))
          .sort((a: any, b: any) => {
            const ao = a.__order;
            const bo = b.__order;
            if (ao == null && bo == null) return 0;
            if (ao == null) return 1;
            if (bo == null) return -1;
            return ao - bo;
          })
          .map(({ __order, ...rest }: any) => rest);

      tools = withOrder(tools, "tool");
      toolkits = withOrder(toolkits, "toolkit");
    }

    const header: StorageHeader = {
      mainDepartment,
      mainStorageName,
      mainStorageCode,
      storageType,
      qrLocation,
      rowName,
    };

    return NextResponse.json({
      type: "storage",
      storage: header,
      shadowboard,
      toolkits,
      tools,
    });
  } catch (err: any) {
    console.error("/api/audits/context error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load audit context" },
      { status: 500 }
    );
  }
}
