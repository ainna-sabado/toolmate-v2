// app/api/audit-snapshots/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { AuditSnapshot } from "@/lib/models/AuditSnapshot.model";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      mainStorageName,
      mainStorageCode,
      cycleId,
      snapshotDate,
      toolData,
      toolKitData,
      totalTools,
      presentTools,
      needsUpdateTools,
      missingTools,
      toolKitsAudited,
      toolKitsPending,
      supervisor, // { name, employeeId } optional, but required every 6th snapshot
    } = body;

    // Basic validation
    if (!mainStorageName || !mainStorageCode) {
      return NextResponse.json(
        { error: "mainStorageName and mainStorageCode are required." },
        { status: 400 }
      );
    }

    if (!cycleId) {
      return NextResponse.json(
        { error: "cycleId is required." },
        { status: 400 }
      );
    }

    // 🔢 How many snapshots already exist for this storage?
    const existingCount = await AuditSnapshot.countDocuments({
      mainStorageName,
      mainStorageCode,
    });

    const snapshotSequence = existingCount + 1; // 1-based
    const requiresSupervisor = snapshotSequence % 6 === 0;

    // 👨‍✈️ Enforce supervisor on every 6th snapshot
    if (requiresSupervisor) {
      if (
        !supervisor ||
        !supervisor.name?.trim() ||
        !supervisor.employeeId?.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Supervisor sign-off (name and employeeId) is required for every 6th snapshot.",
          },
          { status: 400 }
        );
      }
    }

    const snapshot = await AuditSnapshot.create({
      mainStorageName,
      mainStorageCode,
      cycleId,
      snapshotDate, // optional → defaults in schema if missing
      snapshotSequence,
      supervisor: supervisor ?? undefined,
      toolData: Array.isArray(toolData) ? toolData : [],
      toolKitData: Array.isArray(toolKitData) ? toolKitData : [],
      totalTools: totalTools ?? 0,
      presentTools: presentTools ?? 0,
      needsUpdateTools: needsUpdateTools ?? 0,
      missingTools: missingTools ?? 0,
      toolKitsAudited: toolKitsAudited ?? 0,
      toolKitsPending: toolKitsPending ?? 0,
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/audit-snapshots error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create audit snapshot" },
      { status: 500 }
    );
  }
}

/**
 * GET snapshots for a cycle or storage
 * /api/audit-snapshots?cycleId=...&mainStorageName=...&mainStorageCode=...
 */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycleId");
    const mainStorageName = searchParams.get("mainStorageName");
    const mainStorageCode = searchParams.get("mainStorageCode");

    const query: Record<string, any> = {};
    if (cycleId) query.cycleId = cycleId;
    if (mainStorageName) query.mainStorageName = mainStorageName;
    if (mainStorageCode) query.mainStorageCode = mainStorageCode;

    const snapshots = await AuditSnapshot.find(query)
      .sort({ snapshotSequence: 1, snapshotDate: 1, createdAt: 1 })
      .lean();

    return NextResponse.json(snapshots, { status: 200 });
  } catch (err: any) {
    console.error("❌ GET /api/audit-snapshots error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch audit snapshots" },
      { status: 500 }
    );
  }
}
