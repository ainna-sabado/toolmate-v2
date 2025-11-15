import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolKitService from "@/lib/services/ToolKitService";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: kitId } = await context.params;

    const data = await req.json();

    const updatedKit = await ToolKitService.addContent(kitId, data);

    return NextResponse.json(updatedKit, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /toolkits/[id]/contents", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
