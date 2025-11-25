import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/config/db";
import { Tool } from "@/lib/models/Tool.model";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params; // ⭐ Next.js 16 requires awaiting params

    if (!id) {
      return NextResponse.json(
        { error: "Tool ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const allowedFields = [
      "name",
      "brand",
      "category",
      "eqNumber",
      "qty",
      "status",
      "mainStorageName",
      "mainStorageCode",
      "qrLocation",
      "storageType",
      "dueDate",
    ];

    const update: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        update[key] = key === "dueDate" && body[key]
          ? new Date(body[key])
          : body[key];
      }
    }

    const updated = await Tool.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update tool" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Tool ID is required" },
        { status: 400 }
      );
    }

    const deleted = await Tool.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete tool" },
      { status: 500 }
    );
  }
}
