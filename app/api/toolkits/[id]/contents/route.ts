import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolKitService from "@/lib/services/ToolKitService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // ✅ unwrap the params Promise
    const { id: kitId } = await params;

    if (!kitId) {
      return NextResponse.json(
        { error: "Toolkit ID is required" },
        { status: 400 }
      );
    }

    const data = await req.json();
    const updatedKit = await ToolKitService.addContent(kitId, data);

    return NextResponse.json(updatedKit, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/toolkits/[id]/contents:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
