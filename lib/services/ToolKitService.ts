// src/services/ToolKitService.ts

import { ToolKit } from "@/lib/models/ToolKit.model";
import type { ToolKitDocument } from "@/lib/models/ToolKit.model";

export default class ToolKitService {
  /**
   * Create a new toolkit
   */
  static async createToolKit(data: any): Promise<ToolKitDocument> {
    // Required fields
    const required = [
      "name",
      "kitNumber",
      "qrCode",
      "mainStorageName",
      "mainStorageCode",
      "qrLocation",
      "storageType",
    ];

    const missing = required.filter((f) => !data[f]);
    if (missing.length > 0) {
      throw new Error(
        "Missing required fields: " + missing.join(", ")
      );
    }

    // Validate contents
    if (data.contents && Array.isArray(data.contents)) {
      for (const item of data.contents) {
        if (!item.name) {
          throw new Error("Each kit content must include a name");
        }
        if (item.qty && item.qty < 1) {
          throw new Error("Kit content qty must be >= 1");
        }
        if (item.auditStatus) {
          const allowed = ["present", "needsUpdate", "pending"];
          if (!allowed.includes(item.auditStatus)) {
            throw new Error(
              `Invalid auditStatus "${item.auditStatus}". Allowed: ${allowed.join(", ")}`
            );
          }
        }
      }
    }

    // Ensure default
    if (!data.contents) {
      data.contents = [];
    }

    // Create toolkit
    return await ToolKit.create(data);
  }

  /**
   * Lookup toolkits
   */
  static async lookupToolKits(filters: any = {}): Promise<ToolKitDocument[]> {
    return await ToolKit.find(filters).lean();
  }

  /**
   * Get toolkit by ID
   */
  static async getToolKitById(id: string): Promise<ToolKitDocument | null> {
    return await ToolKit.findById(id);
  }

  /**
   * Add a content item to a toolkit
   */
  static async addContent(kitId: string, item: any): Promise<ToolKitDocument> {
    if (!item.name) throw new Error("Content item must have name");
    if (item.qty && item.qty < 1) throw new Error("qty must be >= 1");

    const kit = await ToolKit.findById(kitId);
    if (!kit) throw new Error("Toolkit not found");

    kit.contents.push(item);
    await kit.save();

    return kit;
  }
}
