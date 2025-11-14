// src/services/ToolService.ts

import { Tool } from "@/lib/models/Tool.model";
import type { ToolDocument } from "@/lib/models/Tool.model";

export default class ToolService {
  /**
   * Create a new tool
   */
  static async createTool(data: any): Promise<ToolDocument> {
    // ---------------------------------------------
    // 1. REQUIRED FIELDS
    // ---------------------------------------------
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

    // ---------------------------------------------
    // 2. QUANTITY VALIDATION
    // ---------------------------------------------
    if (data.qty !== undefined) {
      const qtyNumber = Number(data.qty);
      if (isNaN(qtyNumber) || qtyNumber < 1) {
        throw new Error("qty must be a valid number >= 1");
      }
      data.qty = qtyNumber;
    }

    // ---------------------------------------------
    // 3. CLEAN OPTIONAL STRINGS
    // ---------------------------------------------
    const optionalStrings: string[] = ["brand", "category", "eqNumber"];

    optionalStrings.forEach((field) => {
      if (data[field] !== undefined && typeof data[field] === "string") {
        const trimmed = data[field].trim();
        data[field] = trimmed === "" ? undefined : trimmed;
      }
    });

    // ---------------------------------------------
    // 4. UNIQUE eqNumber ENFORCEMENT (ONLY WHEN PROVIDED)
    // ---------------------------------------------
    if (data.eqNumber) {
      const exists = await Tool.findOne({ eqNumber: data.eqNumber });
      if (exists) {
        throw new Error(
          `A tool with eqNumber "${data.eqNumber}" already exists.`
        );
      }
    }

    // ---------------------------------------------
    // 5. TRIM ALL STRING FIELDS (SAFETY)
    // ---------------------------------------------
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === "string") {
        data[key] = data[key].trim();
      }
    });

    // ---------------------------------------------
    // 6. CREATE TOOL
    // ---------------------------------------------
    const tool = await Tool.create(data);
    return tool;
  }

  /**
   * Lookup tools with optional filters
   */
  static async lookupTools(filters: any = {}): Promise<ToolDocument[]> {
    return await Tool.find(filters).lean();
  }

  /**
   * Get tool by ID
   */
  static async getToolById(id: string): Promise<ToolDocument | null> {
    return await Tool.findById(id);
  }
}
