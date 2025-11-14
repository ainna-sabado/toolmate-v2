import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolService from "@/lib/services/ToolService";

export async function GET() {
  await connectDB();
  const tools = await ToolService.lookupTools();
  return NextResponse.json(tools);
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const tool = await ToolService.createTool(body);
    return NextResponse.json(tool, { status: 201 });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
