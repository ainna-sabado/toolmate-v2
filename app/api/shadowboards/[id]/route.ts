import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ShadowboardService from "@/lib/services/ShadowboardService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Next.js 15/16: params is async
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const shadowboard = await ShadowboardService.getById(id);
    if (!shadowboard) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(shadowboard);
  } catch (err: any) {
    console.error("❌ GET /api/shadowboards/[id]:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load shadowboard" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const body = await req.json();
    const updated = await ShadowboardService.update(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ PATCH /api/shadowboards/[id]:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to update shadowboard" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    await connectDB();
    const { id } = await ctx.params;

    const ok = await ShadowboardService.remove(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ DELETE /api/shadowboards/[id]:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to delete shadowboard" },
      { status: 500 }
    );
  }
}
