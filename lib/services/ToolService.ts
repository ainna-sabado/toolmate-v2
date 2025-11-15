import { Tool } from "@/lib/models/Tool.model";
import type { ToolDocument } from "@/lib/models/Tool.model";
import { sanitizeStrings } from "@/lib/utils/sanitize";
import { validateEqNumberUnique } from "@/lib/utils/validateEqNumber";

export default class ToolService {
  /**
   * Create Tool
   */
  static async createTool(data: any): Promise<ToolDocument> {
    // Required fields
    const required = [
      "name",
      "mainDepartment",
      "mainStorageName",
      "mainStorageCode",
      "qrLocation",
      "storageType",
    ];

    const missing = required.filter((f) => !data[f]);
    if (missing.length > 0) {
      throw new Error("Missing required fields: " + missing.join(", "));
    }

    // Sanitize strings
    sanitizeStrings(data);

    // Validate qty
    if (data.qty !== undefined) {
      const qtyNumber = Number(data.qty);
      if (isNaN(qtyNumber) || qtyNumber < 1) {
        throw new Error("qty must be a valid number >= 1");
      }
      data.qty = qtyNumber;
    }

    // Validate unique eqNumber
    if (data.eqNumber) {
      await validateEqNumberUnique(data.eqNumber);
    }

    return await Tool.create(data);
  }

  /**
   * Lookup Tools
   */
  static async lookupTools(filters: any = {}): Promise<ToolDocument[]> {
    return await Tool.find(filters).lean();
  }

  /**
   * Get Tool By ID
   */
  static async getToolById(id: string): Promise<ToolDocument | null> {
    return await Tool.findById(id);
  }
}
