import mongoose from "mongoose";
import { ToolKit } from "@/lib/models/ToolKit.model";
import type { ToolKitDocument } from "@/lib/models/ToolKit.model";

import { sanitizeStrings } from "@/lib/utils/sanitize";
import { validateEqNumberUnique } from "@/lib/utils/validateEqNumber";
import { validateAuditStatus } from "@/lib/utils/validateAuditStatus";

import {
  TOOLKIT_STATUSES,
  TOOLKIT_AUDIT_STATUSES,
} from "@/lib/models/ToolKit.model";

export default class ToolKitService {
  /**
   * Create a new Toolkit
   */
  static async createToolKit(data: any): Promise<ToolKitDocument> {
    const required = [
      "name",
      "kitNumber",
      "qrCode",
      "mainDepartment",
      "mainStorageName",
      "mainStorageCode",
      "qrLocation",
      "storageType",
    ];

    const missing = required.filter((f) => !data[f]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    // Defaults
    data.status ||= "available";
    data.auditStatus ||= "pending";
    data.contents ||= [];

    // Clean fields
    sanitizeStrings(data);

    // Validate statuses
    if (!TOOLKIT_STATUSES.includes(data.status)) {
      throw new Error(
        `Invalid toolkit status "${data.status}". Allowed: ${TOOLKIT_STATUSES.join(
          ", "
        )}`
      );
    }

    if (!TOOLKIT_AUDIT_STATUSES.includes(data.auditStatus)) {
      throw new Error(
        `Invalid toolkit auditStatus "${data.auditStatus}". Allowed: ${TOOLKIT_AUDIT_STATUSES.join(
          ", "
        )}`
      );
    }

    // Validate contents
    for (const item of data.contents) {
      await this.validateContentItem(item);
    }

    return await ToolKit.create(data);
  }

  /**
   * Validate a single content item (add + update + create)
   */
  static async validateContentItem(item: any) {
    if (!item.name) {
      throw new Error("Each content item must include a name");
    }

    // Qty
    if (item.qty !== undefined) {
      const qtyNum = Number(item.qty);
      if (isNaN(qtyNum) || qtyNum < 1) {
        throw new Error("Content qty must be a valid number >= 1");
      }
      item.qty = qtyNum;
    }

    sanitizeStrings(item);

    // Audit status (optional)
    if (item.auditStatus) {
      validateAuditStatus(item.auditStatus);
    }

    // Unique eqNumber
    if (item.eqNumber) {
      await validateEqNumberUnique(item.eqNumber);
    }
  }

  /**
   * Lookup Toolkits
   */
  static async lookupToolKits(filters: any = {}): Promise<ToolKitDocument[]> {
    return await ToolKit.find(filters).lean();
  }

  /**
   * Get Toolkit By ID
   */
  static async getToolKitById(
    id: string
  ): Promise<ToolKitDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await ToolKit.findById(id);
  }

  /**
   * Update Toolkit (partial)
   */
  static async updateToolKit(
    id: string,
    updates: any
  ): Promise<ToolKitDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid toolkit ID");
    }

    // Prevent contents editing here
    if ("contents" in updates) delete updates.contents;

    sanitizeStrings(updates);

    if (updates.status && !TOOLKIT_STATUSES.includes(updates.status)) {
      throw new Error(
        `Invalid toolkit status "${updates.status}". Allowed: ${TOOLKIT_STATUSES.join(
          ", "
        )}`
      );
    }

    if (
      updates.auditStatus &&
      !TOOLKIT_AUDIT_STATUSES.includes(updates.auditStatus)
    ) {
      throw new Error(
        `Invalid toolkit auditStatus "${
          updates.auditStatus
        }". Allowed: ${TOOLKIT_AUDIT_STATUSES.join(", ")}`
      );
    }

    const kit = await ToolKit.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!kit) throw new Error("Toolkit not found");

    return kit;
  }

  /**
   * Delete Toolkit
   */
  static async deleteToolKit(id: string): Promise<ToolKitDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid toolkit ID");
    }

    const deleted = await ToolKit.findByIdAndDelete(id);
    if (!deleted) throw new Error("Toolkit not found");

    return deleted;
  }

  /**
   * Add a content item
   */
  static async addContent(
    kitId: string,
    item: any
  ): Promise<ToolKitDocument> {
    if (!mongoose.Types.ObjectId.isValid(kitId)) {
      throw new Error("Invalid toolkit ID");
    }

    const kit = await ToolKit.findById(kitId);
    if (!kit) throw new Error("Toolkit not found");

    if (!item.auditStatus) item.auditStatus = "pending";

    await this.validateContentItem(item);

    kit.contents.push(item);
    await kit.save();

    return kit;
  }

  /**
   * Update a single content item
   */
  static async updateContent(
    kitId: string,
    contentId: string,
    updates: any
  ): Promise<ToolKitDocument> {
    if (!mongoose.Types.ObjectId.isValid(kitId)) {
      throw new Error("Invalid toolkit ID");
    }
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new Error("Invalid content item ID");
    }

    const kit = await ToolKit.findById(kitId);
    if (!kit) throw new Error("Toolkit not found");

    const idx = kit.contents.findIndex(
      (c: any) => c._id?.toString() === contentId
    );
    if (idx === -1) throw new Error("Content item not found");

    const existingItem: any =
      typeof kit.contents[idx].toObject === "function"
        ? kit.contents[idx].toObject()
        : kit.contents[idx];

    const merged = { ...existingItem, ...updates };

    if (!merged.auditStatus) {
      merged.auditStatus = existingItem.auditStatus || "pending";
    }

    await this.validateContentItem(merged);

    kit.contents[idx] = merged;
    await kit.save();

    return kit;
  }

  /**
   * Delete a single content item
   */
  static async deleteContent(
    kitId: string,
    contentId: string
  ): Promise<ToolKitDocument> {
    if (!mongoose.Types.ObjectId.isValid(kitId)) {
      throw new Error("Invalid toolkit ID");
    }
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new Error("Invalid content item ID");
    }

    const kit = await ToolKit.findById(kitId);
    if (!kit) throw new Error("Toolkit not found");

    const before = kit.contents.length;

    kit.contents = kit.contents.filter(
      (c: any) => c._id?.toString() !== contentId
    );

    if (kit.contents.length === before) {
      throw new Error("Content item not found");
    }

    await kit.save();

    return kit;
  }
}
