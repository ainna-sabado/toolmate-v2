import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { StorageLocation } from "@/lib/models/StorageLocation.model";

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
            rowName: String(rowName).trim(),
            qrCode: String(qrCode).trim(),
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
