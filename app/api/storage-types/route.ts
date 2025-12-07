// app/api/storage-types/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import StorageSettingsService from "@/lib/services/StorageSettingsService";
import { StorageType } from "@/lib/models/StorageType.model"; // adjust path if needed

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

// UPDATE storage type
export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, name, description } = body || {};

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const update: any = {};
    if (typeof name === "string") {
      update.name = name.trim().toUpperCase();
    }
    if (typeof description === "string") {
      update.description = description.trim();
    }

    const updated = await StorageType.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Storage type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ PATCH /api/storage-types error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to update storage type" },
      { status: 400 }
    );
  }
}

// DELETE storage type
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

    const deleted = await StorageType.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json(
        { error: "Storage type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ DELETE /api/storage-types error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to delete storage type" },
      { status: 400 }
    );
  }
}
