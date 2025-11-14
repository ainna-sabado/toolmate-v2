import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { Tool } from "@/lib/models/Tool.model";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const mainDepartment = searchParams.get("mainDepartment");
    const mainStorageName = searchParams.get("mainStorageName");
    const storagesOnly = searchParams.get("storages");

    const filters: any = {};
    if (mainDepartment) filters.mainDepartment = mainDepartment;
    if (mainStorageName) filters.mainStorageName = mainStorageName;

    const tools = await Tool.find(filters).lean();

    // Return unique storage list if requested
    if (storagesOnly === "1") {
      const map = new Map();

      tools.forEach((tool: any) => {
        if (tool.mainStorageName) {
          map.set(tool.mainStorageName, {
            mainStorageName: tool.mainStorageName,
            mainStorageCode: tool.mainStorageCode,
            storageType: tool.storageType,
          });
        }
      });

      return NextResponse.json({ storages: Array.from(map.values()) });
    }

    return NextResponse.json({ tools });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const tool = await Tool.create(body);

    return NextResponse.json(tool, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
