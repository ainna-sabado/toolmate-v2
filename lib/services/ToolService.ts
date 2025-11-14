// src/services/ToolService.ts

import { Tool } from "@/lib/models/Tool.model";
import { ToolDocument } from "@/lib/models/Tool.model";

export default class ToolService {
  /**
   * Create a new tool
   */
  static async createTool(data: any): Promise<ToolDocument> {
    // Required validation
    const required = [
      "name",
      "mainStorageName",
      "mainStorageCode",
      "qrLocation",
      "storageType"
    ];

    const missing = required.filter((f) => !data[f]);
    if (missing.length > 0) {
      throw new Error("Missing required fields: " + missing.join(", "));
    }

    // Quantity validation
    if (data.qty && data.qty < 1) {
      throw new Error("qty must be >= 1");
    }

    // Create tool
    const tool = await Tool.create(data);
    return tool;
  }

  /**
   * Find tools with optional filters
   */
  static async lookupTools(filters: any = {}): Promise<ToolDocument[]> {
    return await Tool.find(filters).lean();
  }

  /**
   * Find tool by ID
   */
  static async getToolById(id: string): Promise<ToolDocument | null> {
    return await Tool.findById(id);
  }
}
