import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { Tool } from "@/lib/models/Tool.model";

export async function GET() {
  try {
    await connectDB();

    const tools = await Tool.find({}, "brand category").lean();

    const brands = new Set<string>();
    const categories = new Set<string>();

    tools.forEach((t) => {
      if (t.brand) brands.add(t.brand);
      if (t.category) categories.add(t.category);
    });

    return NextResponse.json({
      brands: Array.from(brands),
      categories: Array.from(categories),
    });
  } catch (err: any) {
    console.error("❌ GET /api/tools/meta:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
