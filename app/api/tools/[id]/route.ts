// app/api/tools/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import ToolService from "@/lib/services/ToolService";

type RouteContext = {
  params: { id?: string };
};

// Small helper: get ID from params OR from URL path
function extractToolId(req: Request, params: { id?: string }): string | null {
  // 1) Normal case: Next gives us params.id
  if (params && params.id) return params.id;

  // 2) Fallback: derive from URL path
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // e.g. /api/tools/675f0d2b3c -> ["api","tools","675f0d2b3c"]
  const last = segments[segments.length - 1];

  if (!last || last === "tools") {
    return null;
  }

  return last;
}

// ✅ UPDATE TOOL
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const toolId = extractToolId(req, params || {});
    if (!toolId) {
      console.error("PATCH /api/tools/[id] missing id", {
        params,
        url: req.url,
      });

      return NextResponse.json(
        { error: "Tool ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updated = await ToolService.updateTool(toolId, body);

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ PATCH /api/tools/[id] error:", err?.message || err);
    return NextResponse.json(
      { error: err.message || "Failed to update tool" },
      { status: 500 }
    );
  }
}

// ✅ DELETE TOOL
export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    await connectDB();

    const toolId = extractToolId(req, params || {});
    if (!toolId) {
      console.error("DELETE /api/tools/[id] missing id", {
        params,
        url: req.url,
      });

      return NextResponse.json(
        { error: "Tool ID is required" },
        { status: 400 }
      );
    }

    const deleted = await ToolService.deleteTool(toolId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ DELETE /api/tools/[id] error:", err?.message || err);
    return NextResponse.json(
      { error: err.message || "Failed to delete tool" },
      { status: 500 }
    );
  }
}
