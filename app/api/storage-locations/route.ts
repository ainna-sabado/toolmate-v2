// app/api/storage-locations/route.ts
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
      mainStorageName: String(mainStorageName).trim().toUpperCase(),
      mainStorageCode: String(mainStorageCode).trim().toUpperCase(),
      storageType: String(storageType).trim().toUpperCase(),
      isActive: true,
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

// UPDATE main storage (name/code/type/isActive)
export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, mainStorageName, mainStorageCode, storageType, isActive } =
      body || {};

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const update: Record<string, any> = {};
    if (typeof mainStorageName === "string") {
      update.mainStorageName = mainStorageName.trim().toUpperCase();
    }
    if (typeof mainStorageCode === "string") {
      update.mainStorageCode = mainStorageCode.trim().toUpperCase();
    }
    if (typeof storageType === "string") {
      update.storageType = storageType.trim().toUpperCase();
    }
    if (typeof isActive === "boolean") {
      update.isActive = isActive;
    }

    const updated = await StorageLocation.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Storage location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ PATCH /api/storage-locations:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to update storage location" },
      { status: 400 }
    );
  }
}

// SOFT DELETE main storage (isActive = false)
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = body || {};

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updated = await StorageLocation.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Storage location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ DELETE /api/storage-locations:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to delete storage location" },
      { status: 400 }
    );
  }
}
