import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolKitService from "@/lib/services/ToolKitService";
import { buildFilters } from "@/lib/utils/buildFilters";
import { mapStorages } from "@/lib/utils/storageMapper";

// ---------------------------------------------------------
// GET /api/toolkits
// ---------------------------------------------------------
export async function GET(req: Request) {
  try {
    await connectDB();

    const params = new URL(req.url).searchParams;
    const filters = buildFilters(params);

    // Load toolkits based on filters (e.g., mainDepartment)
    const toolkits = await ToolKitService.lookupToolKits(filters);

    // Extract distinct storage locations for filtering (frontend)
    const storageLocations = mapStorages(toolkits);

    return NextResponse.json(
      {
        toolkits,
        storageLocations,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ GET /api/toolkits error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load toolkits." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------
// POST /api/toolkits
// ---------------------------------------------------------
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const toolkit = await ToolKitService.createToolKit(body);

    return NextResponse.json(toolkit, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/toolkits error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create toolkit." },
      { status: 400 }
    );
  }
}
