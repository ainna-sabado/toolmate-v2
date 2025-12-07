// app/api/storage-types/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import StorageSettingsService from "@/lib/services/StorageSettingsService";

export async function GET() {
  try {
    await connectDB();
    const types = await StorageSettingsService.listStorageTypes();
    return NextResponse.json(types);
  } catch (err: any) {
    console.error("❌ GET /api/storage-types error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load storage types" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const payload = await req.json();
    const created = await StorageSettingsService.createStorageType(payload);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/storage-types error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create storage type" },
      { status: 400 }
    );
  }
}
