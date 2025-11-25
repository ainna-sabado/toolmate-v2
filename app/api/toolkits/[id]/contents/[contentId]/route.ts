// app/api/toolkits/[id]/contents/[contentId]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/config/db";
import { ToolKit } from "@/lib/models/ToolKit.model";
import { sanitizeStrings } from "@/lib/utils/sanitize";

type ParamsPromise = Promise<{ id: string; contentId: string }>;

// ✅ Update a single kit content item
export async function PATCH(
  req: NextRequest,
  context: { params: ParamsPromise }
) {
  try {
    await connectDB();

    const { id: kitId, contentId } = await context.params;

    if (!kitId || !contentId) {
      return NextResponse.json(
        { error: "Toolkit ID and content ID are required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      name,
      brand,
      category,
      eqNumber,
      qty,
      calDate,
    } = body;

    const setObj: any = {};

    if (name !== undefined) setObj["contents.$.name"] = name;
    if (brand !== undefined) setObj["contents.$.brand"] = brand;
    if (category !== undefined) setObj["contents.$.category"] = category;
    if (eqNumber !== undefined) setObj["contents.$.eqNumber"] = eqNumber;
    if (qty !== undefined) setObj["contents.$.qty"] = qty;
    if (calDate !== undefined) {
      setObj["contents.$.calDate"] = calDate ? new Date(calDate) : null;
    }

    sanitizeStrings(setObj);

    const updatedKit = await ToolKit.findOneAndUpdate(
      { _id: kitId, "contents._id": contentId },
      { $set: setObj },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedKit) {
      return NextResponse.json(
        { error: "Toolkit or content item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedKit);
  } catch (err: any) {
    console.error(
      "PATCH /api/toolkits/[id]/contents/[contentId] error:",
      err
    );
    return NextResponse.json(
      { error: err.message || "Failed to update kit item" },
      { status: 500 }
    );
  }
}

// ✅ Delete a single kit content item
export async function DELETE(
  _req: NextRequest,
  context: { params: ParamsPromise }
) {
  try {
    await connectDB();

    const { id: kitId, contentId } = await context.params;

    if (!kitId || !contentId) {
      return NextResponse.json(
        { error: "Toolkit ID and content ID are required" },
        { status: 400 }
      );
    }

    const updatedKit = await ToolKit.findByIdAndUpdate(
      kitId,
      { $pull: { contents: { _id: contentId } } },
      { new: true }
    ).lean();

    if (!updatedKit) {
      return NextResponse.json(
        { error: "Toolkit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(
      "DELETE /api/toolkits/[id]/contents/[contentId] error:",
      err
    );
    return NextResponse.json(
      { error: err.message || "Failed to delete kit item" },
      { status: 500 }
    );
  }
}
