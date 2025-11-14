import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { Tool } from "@/lib/models/Tool.model";

export async function GET() {
  try {
    await connectDB();

    // Get unique department list
    const departments = await Tool.distinct("mainDepartment");

    return NextResponse.json({ departments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
