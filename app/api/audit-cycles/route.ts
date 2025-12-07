// app/api/audit-cycles/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { AuditCycle } from "@/lib/models/AuditCycle.model";
import type { AuditFrequency } from "@/lib/models/AuditCycle.model";

// Small helper: infer sensible defaults for maxCycles from frequency
function getDefaultMaxCycles(frequency?: AuditFrequency): number {
  switch (frequency) {
    case "quarterly":
      return 4;
    case "custom":
      return 1;
    case "monthly":
    default:
      return 12;
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      mainDepartment,
      mainStorageName,
      mainStorageCode,
      storageType,
      frequency,     // optional, schema default "monthly"
      cycleNumber,   // optional, schema default 0
      maxCycles,     // optional, we infer from frequency if missing
      nextAuditDate,
      lastAuditDate,
      status,        // optional, schema default "not_started"
    } = body;

    if (!mainDepartment || !mainStorageName || !mainStorageCode || !storageType) {
      return NextResponse.json(
        {
          error:
            "mainDepartment, mainStorageName, mainStorageCode, and storageType are required.",
        },
        { status: 400 }
      );
    }

    if (!nextAuditDate) {
      return NextResponse.json(
        { error: "nextAuditDate is required." },
        { status: 400 }
      );
    }

    const effectiveFrequency: AuditFrequency = frequency ?? "monthly";
    const effectiveMaxCycles =
      typeof maxCycles === "number" && maxCycles > 0
        ? maxCycles
        : getDefaultMaxCycles(effectiveFrequency);

    const cycle = await AuditCycle.create({
      mainDepartment,
      mainStorageName,
      mainStorageCode,
      storageType,
      frequency: effectiveFrequency,
      maxCycles: effectiveMaxCycles,
      // for a new schedule year/programme, we usually start at 0 required cycles satisfied
      cycleNumber: typeof cycleNumber === "number" ? cycleNumber : 0,
      nextAuditDate,
      lastAuditDate: lastAuditDate ?? null,
      status, // optional, defaults to "not_started" if omitted
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/audit-cycles error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create audit cycle" },
      { status: 500 }
    );
  }
}

/**
 * GET cycles for a storage (optional helper)
 * /api/audit-cycles?mainDepartment=...&mainStorageName=...&mainStorageCode=...
 */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const mainDepartment = searchParams.get("mainDepartment");
    const mainStorageName = searchParams.get("mainStorageName");
    const mainStorageCode = searchParams.get("mainStorageCode");

    const query: Record<string, any> = {};
    if (mainDepartment) query.mainDepartment = mainDepartment;
    if (mainStorageName) query.mainStorageName = mainStorageName;
    if (mainStorageCode) query.mainStorageCode = mainStorageCode;

    const cycles = await AuditCycle.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(cycles, { status: 200 });
  } catch (err: any) {
    console.error("❌ GET /api/audit-cycles error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch audit cycles" },
      { status: 500 }
    );
  }
}
