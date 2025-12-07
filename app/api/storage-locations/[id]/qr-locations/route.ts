// app/api/storage-locations/[id]/qr-locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { StorageLocation } from "@/lib/models/StorageLocation.model";

// ADD new row / QR location
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Storage location ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { rowName, qrCode } = body || {};

    if (!rowName || !qrCode) {
      return NextResponse.json(
        { error: "rowName and qrCode are required" },
        { status: 400 }
      );
    }

    const updated = await StorageLocation.findByIdAndUpdate(
      id,
      {
        $push: {
          qrLocations: {
            rowName: String(rowName).trim().toUpperCase(),
            qrCode: String(qrCode).trim().toUpperCase(),
          },
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Storage location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ POST /api/storage-locations/[id]/qr-locations:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to add QR location" },
      { status: 400 }
    );
  }
}

// UPDATE existing row / QR location
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Storage location ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { qrLocationId, rowName, qrCode } = body || {};

    if (!qrLocationId) {
      return NextResponse.json(
        { error: "qrLocationId is required" },
        { status: 400 }
      );
    }

    const update: any = {};
    if (typeof rowName === "string") {
      update["qrLocations.$.rowName"] = rowName.trim().toUpperCase();
    }
    if (typeof qrCode === "string") {
      update["qrLocations.$.qrCode"] = qrCode.trim().toUpperCase();
    }

    const updated = await StorageLocation.findOneAndUpdate(
      { _id: id, "qrLocations._id": qrLocationId },
      { $set: update },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "QR location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ PATCH /api/storage-locations/[id]/qr-locations:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to update QR location" },
      { status: 400 }
    );
  }
}

// DELETE row / QR location
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Storage location ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { qrLocationId } = body || {};

    if (!qrLocationId) {
      return NextResponse.json(
        { error: "qrLocationId is required" },
        { status: 400 }
      );
    }

    const updated = await StorageLocation.findByIdAndUpdate(
      id,
      {
        $pull: { qrLocations: { _id: qrLocationId } },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "QR location or storage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ DELETE /api/storage-locations/[id]/qr-locations:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to delete QR location" },
      { status: 400 }
    );
  }
}
