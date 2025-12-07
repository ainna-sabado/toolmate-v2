// app/api/dashboard/eq5044-report/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import EQ5044ReportService from "@/lib/services/EQ5044ReportService";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const mainDepartment = searchParams.get("mainDepartment");
    const mainStorageName = searchParams.get("mainStorageName");
    const mainStorageCode = searchParams.get("mainStorageCode");

    if (!mainDepartment || !mainStorageName || !mainStorageCode) {
      return NextResponse.json(
        { error: "Missing required query params." },
        { status: 400 }
      );
    }

    const report = await EQ5044ReportService.getReport({
      mainDepartment,
      mainStorageName,
      mainStorageCode,
    });

    if (!report) {
      return NextResponse.json(
        { error: "No data found for this storage." },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (err: any) {
    console.error("❌ GET /api/dashboard/eq5044-report error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to generate EQ5044 report" },
      { status: 500 }
    );
  }
}
