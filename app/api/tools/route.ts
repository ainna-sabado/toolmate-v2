import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolService from "@/lib/services/ToolService";
import { Tool } from "@/lib/models/Tool.model";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Extract GET filters
    const mainDepartment = searchParams.get("mainDepartment");
    const mainStorageName = searchParams.get("mainStorageName");
    const qrLocation = searchParams.get("qrLocation");
    const storageType = searchParams.get("storageType");

    // Extra mode for fetching unique storages
    const getStoragesOnly = searchParams.get("storages") === "1";

    // ---------------------------------------------
    // STORAGE LOOKUP MODE
    // ---------------------------------------------
    if (getStoragesOnly) {
      if (!mainDepartment) {
        return NextResponse.json(
          { error: "mainDepartment is required when storages=1" },
          { status: 400 }
        );
      }

      const tools = await Tool.find(
        { mainDepartment },
        "mainStorageName mainStorageCode"
      ).lean();

      const unique = new Map<
        string,
        { mainStorageName: string; mainStorageCode: string }
      >();

      tools.forEach((t) => {
        if (t.mainStorageName && t.mainStorageCode) {
          unique.set(t.mainStorageName, {
            mainStorageName: t.mainStorageName,
            mainStorageCode: t.mainStorageCode,
          });
        }
      });

      return NextResponse.json({
        storages: Array.from(unique.values()),
      });
    }

    // -----------------------------------------------------
    // LOAD UNIQUE QR LOCATIONS BASED ON SELECTED STORAGE
    // -----------------------------------------------------
    const loadQrLocations = async (storageName: string) => {
      if (!mainDepartment || !storageName) return;

      try {
        const res = await fetch(
          `/api/tools?mainDepartment=${encodeURIComponent(
            mainDepartment
          )}&mainStorageName=${encodeURIComponent(storageName)}`
        );

        const data = await res.json();
        const tools = data.tools || [];

        const uniq = new Set<string>();
        tools.forEach((tool: any) => {
          if (tool.qrLocation) uniq.add(tool.qrLocation);
        });

        setQrLocations([...uniq]);
      } catch (err) {
        console.error("Error loading QR locations", err);
      }
    };

    // ---------------------------------------------
    // NORMAL TOOL LOOKUP MODE
    // ---------------------------------------------
    const filters: any = {};

    if (mainDepartment) filters.mainDepartment = mainDepartment;
    if (mainStorageName) filters.mainStorageName = mainStorageName;
    if (qrLocation) filters.qrLocation = qrLocation;
    if (storageType) filters.storageType = storageType;

    const tools = await ToolService.lookupTools(filters);

    return NextResponse.json({ tools });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const tool = await ToolService.createTool(body);

    return NextResponse.json(tool, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
