import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolKitService from "@/lib/services/ToolKitService";

/**
 * Add a content item to a toolkit
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> } // App Router requires this
) {
  try {
    await connectDB();

    // ⭐ IMPORTANT: unwrap params (App Router dynamic route behavior)
    const { id } = await context.params;

    console.log("➡️ POST /api/toolkits/[id]/contents");
    console.log("   kitId:", id);

    const body = await req.json();

    const updated = await ToolKitService.addContent(id, body);

    return NextResponse.json(updated, { status: 200 });

  } catch (error: any) {
    console.error("❌ Error adding content:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
