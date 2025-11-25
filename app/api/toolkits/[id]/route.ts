// app/api/toolkits/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/config/db";
import { ToolKit } from "@/lib/models/ToolKit.model";
import {
  TOOLKIT_STATUSES,
} from "@/lib/models/ToolKit.model";
import { sanitizeStrings } from "@/lib/utils/sanitize";

type ParamsPromise = Promise<{ id: string }>;

// ✅ Update a single toolkit
export async function PATCH(
  req: NextRequest,
  context: { params: ParamsPromise }
) {
  try {
    await connectDB();

    const { id: kitId } = await context.params;

    if (!kitId) {
      return NextResponse.json(
        { error: "Toolkit ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Only allow specific fields to be updated
    const {
      name,
      kitNumber,
      brand,
      category,
      status,
      mainStorageName,
      mainStorageCode,
      qrLocation,
      storageType,
    } = body;

    const update: any = {};

    if (name !== undefined) update.name = name;
    if (kitNumber !== undefined) update.kitNumber = kitNumber;
    if (brand !== undefined) update.brand = brand;
    if (category !== undefined) update.category = category;

    if (status !== undefined) {
      if (!TOOLKIT_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid toolkit status "${status}". Allowed: ${TOOLKIT_STATUSES.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
      update.status = status;
    }

    if (mainStorageName !== undefined) update.mainStorageName = mainStorageName;
    if (mainStorageCode !== undefined) update.mainStorageCode = mainStorageCode;
    if (qrLocation !== undefined) update.qrLocation = qrLocation;
    if (storageType !== undefined) update.storageType = storageType;

    // Clean strings
    sanitizeStrings(update);

    const updated = await ToolKit.findByIdAndUpdate(kitId, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Toolkit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/toolkits/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update toolkit" },
      { status: 500 }
    );
  }
}

// ✅ Delete a single toolkit
export async function DELETE(
  _req: NextRequest,
  context: { params: ParamsPromise }
) {
  try {
    await connectDB();

    const { id: kitId } = await context.params;

    if (!kitId) {
      return NextResponse.json(
        { error: "Toolkit ID is required" },
        { status: 400 }
      );
    }

    const deleted = await ToolKit.findByIdAndDelete(kitId).lean();

    if (!deleted) {
      return NextResponse.json(
        { error: "Toolkit not found" },
        { status: 404 }
      );
    }

    // Contents are embedded; deleting the doc deletes contents too
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/toolkits/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete toolkit" },
      { status: 500 }
    );
  }
}
