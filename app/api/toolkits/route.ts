// app/api/toolkits/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolKitService from "@/lib/services/ToolKitService";

export async function GET() {
  await connectDB();
  const kits = await ToolKitService.lookupToolKits();
  return NextResponse.json(kits);
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    const kit = await ToolKitService.createToolKit(data);
    return NextResponse.json(kit, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
