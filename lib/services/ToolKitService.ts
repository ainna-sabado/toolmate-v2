import mongoose from "mongoose";
import { ToolKit } from "@/lib/models/ToolKit.model";
import { Tool } from "@/lib/models/Tool.model";
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
    // Required fields
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

    // Clean strings
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

    // Create
    return await ToolKit.create(data);
  }

  /**
   * Validate content items (shared between create + add)
   */
  static async validateContentItem(item: any) {
    if (!item.name) {
      throw new Error("Each content item must include a name");
    }

    // Qty
    if (item.qty && item.qty < 1) {
      throw new Error("Content qty must be >= 1");
    }

    // Clean fields
    sanitizeStrings(item);

    // Audit status
    validateAuditStatus(item.auditStatus);

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
  static async getToolKitById(id: string): Promise<ToolKitDocument | null> {
    return await ToolKit.findById(id);
  }

  /**
   * Add a content item
   */
  static async addContent(kitId: string, item: any): Promise<ToolKitDocument> {
    if (!mongoose.Types.ObjectId.isValid(kitId)) {
      throw new Error("Invalid toolkit ID");
    }

    const kit = await ToolKit.findById(kitId);
    if (!kit) throw new Error("Toolkit not found");

    // Validate item
    await this.validateContentItem(item);

    kit.contents.push(item);
    await kit.save();

    return kit;
  }
}
