// app/api/tools/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolService from "@/lib/services/ToolService";
import { buildFilters } from "@/lib/utils/buildFilters";
import { mapStorages } from "@/lib/utils/storageMapper";

export async function GET(req: Request) {
  try {
    await connectDB();

    const params = new URL(req.url).searchParams;
    const filters = buildFilters(params);

    const storagesOnly = params.get("storages") === "1";

    const tools = await ToolService.getTools(filters);

    if (storagesOnly) {
      const storages = mapStorages(tools);
      return NextResponse.json({ storages });
    }

    return NextResponse.json({ tools });
  } catch (err: any) {
    console.error("❌ GET /api/tools error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const data = await req.json();
    const tool = await ToolService.createTool(data);

    return NextResponse.json(tool, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/tools error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
