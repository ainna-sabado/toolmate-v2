import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolKitService from "@/lib/services/ToolKitService";
import { buildFilters } from "@/lib/utils/buildFilters";
import { mapStorages } from "@/lib/utils/storageMapper";

export async function GET(req: Request) {
  try {
    await connectDB();

    const params = new URL(req.url).searchParams;
    const filters = buildFilters(params);

    const toolkits = await ToolKitService.lookupToolKits(filters);
    const storageLocations = mapStorages(toolkits);

    return NextResponse.json({ toolkits, storageLocations });
  } catch (err: any) {
    console.error("❌ GET /api/toolkits:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const toolkit = await ToolKitService.createToolKit(body);

    return NextResponse.json(toolkit, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/toolkits:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
