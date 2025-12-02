// app/api/dashboard/storage-detail/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import StorageAuditDetailService from "@/lib/services/StorageAuditDetailService";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const mainDepartment = searchParams.get("mainDepartment");
    const mainStorageName = searchParams.get("mainStorageName");
    const mainStorageCode = searchParams.get("mainStorageCode");

    if (!mainDepartment || !mainStorageName || !mainStorageCode) {
      return NextResponse.json(
        { error: "Missing required query params" },
        { status: 400 }
      );
    }

    const detail = await StorageAuditDetailService.getStorageDetail({
      mainDepartment,
      mainStorageName,
      mainStorageCode,
    });

    if (!detail) {
      return NextResponse.json(
        { error: "Storage not found or no tools/toolkits here yet" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...detail,
      nextAuditDate: detail.nextAuditDate
        ? detail.nextAuditDate.toISOString()
        : null,
    });
  } catch (err: any) {
    console.error("❌ GET /api/dashboard/storage-detail error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load storage detail" },
      { status: 500 }
    );
  }
}
