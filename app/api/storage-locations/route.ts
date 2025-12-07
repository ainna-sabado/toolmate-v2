import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { StorageLocation } from "@/lib/models/StorageLocation.model";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const mainDepartment = searchParams.get("mainDepartment");

    // Build query: always active, optionally filtered by department
    const query: Record<string, any> = { isActive: true };
    if (mainDepartment) {
      query.mainDepartment = mainDepartment;
    }

    const locations = await StorageLocation.find(query)
      .sort({ mainStorageName: 1, mainStorageCode: 1 })
      .lean();

    return NextResponse.json(locations);
  } catch (err: any) {
    console.error("❌ GET /api/storage-locations:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load storage locations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { mainDepartment, mainStorageName, mainStorageCode, storageType } =
      body || {};

    if (!mainDepartment || !mainStorageName || !mainStorageCode || !storageType) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const location = await StorageLocation.create({
      mainDepartment: String(mainDepartment).trim(),
      mainStorageName: String(mainStorageName).trim(),
      mainStorageCode: String(mainStorageCode).trim(),
      storageType: String(storageType).trim(),
    });

    return NextResponse.json(location.toObject(), { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/storage-locations:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create storage location" },
      { status: 400 }
    );
  }
}
