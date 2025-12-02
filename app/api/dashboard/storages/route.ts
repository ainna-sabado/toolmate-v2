import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import AuditDashboardService from "@/lib/services/AuditDashboardService";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const mainDepartment = searchParams.get("mainDepartment") || undefined;

    const rows = await AuditDashboardService.getStorageDashboard(mainDepartment);

    // Convert Dates to ISO strings for JSON
    const payload = rows.map((row) => ({
      ...row,
      nextAuditDate: row.nextAuditDate
        ? row.nextAuditDate.toISOString()
        : null,
    }));

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("❌ GET /api/dashboard/storages error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load storage dashboard" },
      { status: 500 }
    );
  }
}
