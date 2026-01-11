import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ShadowboardService from "@/lib/services/ShadowboardService";

export async function GET(req: Request) {
  try {
    await connectDB();

    const params = new URL(req.url).searchParams;
    const scopeType = (params.get("scopeType") || "storage") as "storage" | "toolkit";

    if (scopeType === "toolkit") {
      const toolkitId = params.get("toolkitId") || "";
      const shadowboards = await ShadowboardService.list({ scopeType: "toolkit", toolkitId });
      return NextResponse.json(shadowboards);
    }

    const mainDepartment = params.get("mainDepartment") || "";
    const mainStorageName = params.get("mainStorageName") || "";
    const mainStorageCode = params.get("mainStorageCode") || "";

    // qrLocation:
    // - missing => undefined (no filter)
    // - ""      => null (whole storage)
    // - value   => string
    const qrLocationRaw = params.get("qrLocation");
    const qrLocation =
      qrLocationRaw === null ? undefined : qrLocationRaw === "" ? null : qrLocationRaw;

    const shadowboards = await ShadowboardService.list({
      scopeType: "storage",
      mainDepartment,
      mainStorageName,
      mainStorageCode,
      qrLocation,
    });

    return NextResponse.json(shadowboards);
  } catch (err: any) {
    console.error("❌ GET /api/shadowboards:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load shadowboards" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const created = await ShadowboardService.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/shadowboards:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create shadowboard" },
      { status: 500 }
    );
  }
}
