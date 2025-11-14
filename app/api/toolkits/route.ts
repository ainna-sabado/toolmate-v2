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

    const toolkits = await ToolKitService.lookupToolKits(filters);

    return NextResponse.json({ toolkits });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const toolkit = await ToolKitService.createToolKit(body);

    return NextResponse.json(toolkit, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
