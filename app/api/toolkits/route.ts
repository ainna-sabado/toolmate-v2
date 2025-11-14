import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolKitService from "@/lib/services/ToolKitService";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const mainDepartment = searchParams.get("mainDepartment");
    const mainStorageName = searchParams.get("mainStorageName");
    const qrLocation = searchParams.get("qrLocation");
    const storageType = searchParams.get("storageType");

    const filters: any = {};
    if (mainDepartment) filters.mainDepartment = mainDepartment;
    if (mainStorageName) filters.mainStorageName = mainStorageName;
    if (qrLocation) filters.qrLocation = qrLocation;
    if (storageType) filters.storageType = storageType;

    // --------------------------------------------------------
    // Fetch toolkits
    // --------------------------------------------------------
    const toolkits = await ToolKitService.lookupToolKits(filters);

    // If nothing returned, prevent crash
    if (!toolkits || !Array.isArray(toolkits)) {
      return NextResponse.json({
        toolkits: [],
        storageLocations: [],
      });
    }

    // --------------------------------------------------------
    // Build unique storage locations SAFELY
    // --------------------------------------------------------
    const storageMap = new Map();

    toolkits.forEach((kit: any) => {
      if (
        kit &&
        kit.mainStorageName &&
        typeof kit.mainStorageName === "string"
      ) {
        storageMap.set(kit.mainStorageName, {
          mainStorageName: kit.mainStorageName,
          mainStorageCode: kit.mainStorageCode || "",
          storageType: kit.storageType || "",
        });
      }
    });

    const storageLocations = Array.from(storageMap.values());

    return NextResponse.json({
      toolkits,
      storageLocations,
    });
  } catch (err: any) {
    console.error("❌ Toolkit API Error:", err.message);
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
    console.error("❌ Toolkit POST Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
