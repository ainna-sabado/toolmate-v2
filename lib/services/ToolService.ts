// lib/services/ToolService.ts
import { Tool } from "@/lib/models/Tool.model";
import type { ToolDocument } from "@/lib/models/Tool.model";
import { sanitizeStrings } from "@/lib/utils/sanitize";
import { validateEqNumberUnique } from "@/lib/utils/validateEqNumber";

export default class ToolService {
  // -------------------------------------------------
  // CREATE
  // -------------------------------------------------
  /**
   * Create a new tool.
   * Validates required fields, qty, and eqNumber uniqueness.
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

    // Sanitize all string fields
    sanitizeStrings(data);

    // Validate qty
    if (data.qty !== undefined) {
      const qtyNumber = Number(data.qty);
      if (isNaN(qtyNumber) || qtyNumber < 1) {
        throw new Error("qty must be a valid number >= 1");
      }
      data.qty = qtyNumber;
    }

    // Validate unique eqNumber (if provided)
    if (data.eqNumber) {
      await validateEqNumberUnique(data.eqNumber);
    }

    // Handle dueDate if it's coming as string
    if (data.dueDate !== undefined) {
      data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    return await Tool.create(data);
  }

  // -------------------------------------------------
  // READ / LIST
  // -------------------------------------------------
  /**
   * Get list of tools, optionally filtered.
   * e.g. ToolService.getTools({ mainDepartment: "Components & APU CHC" })
   */
  static async getTools(filters: any = {}): Promise<ToolDocument[]> {
    return await Tool.find(filters).lean();
  }

  /**
   * Backwards-compatible alias for older code that used lookupTools.
   */
  static async lookupTools(filters: any = {}): Promise<ToolDocument[]> {
    return this.getTools(filters);
  }

  /**
   * Get a single tool by ID.
   */
  static async getToolById(id: string): Promise<ToolDocument | null> {
    if (!id) {
      throw new Error("Tool ID is required");
    }

    return await Tool.findById(id);
  }

  // -------------------------------------------------
  // UPDATE
  // -------------------------------------------------
  /**
   * Update an existing tool by ID.
   * Applies the same validation rules as create where relevant.
   */
  static async updateTool(
    id: string,
    changes: any
  ): Promise<ToolDocument> {
    if (!id) {
      throw new Error("Tool ID is required");
    }

    const tool = await Tool.findById(id);
    if (!tool) {
      throw new Error("Tool not found");
    }

    // Only allow specific fields to be updated
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
      if (key in changes) {
        update[key] = changes[key];
      }
    }

    // Sanitize strings in the update object
    sanitizeStrings(update);

    // Validate qty if present
    if (update.qty !== undefined) {
      const qtyNumber = Number(update.qty);
      if (isNaN(qtyNumber) || qtyNumber < 1) {
        throw new Error("qty must be a valid number >= 1");
      }
      update.qty = qtyNumber;
    }

    // Validate unique eqNumber if it changed
    if (update.eqNumber && update.eqNumber !== tool.eqNumber) {
      await validateEqNumberUnique(update.eqNumber);
    }

    // Normalize dueDate
    if ("dueDate" in update) {
      update.dueDate = update.dueDate ? new Date(update.dueDate) : null;
    }

    // Apply changes onto the existing document
    Object.assign(tool, update);

    await tool.save();
    return tool;
  }

  // -------------------------------------------------
  // DELETE
  // -------------------------------------------------
  /**
   * Delete a tool by ID.
   * Returns true if deleted, false if not found.
   */
  static async deleteTool(id: string): Promise<boolean> {
    if (!id) {
      throw new Error("Tool ID is required");
    }

    const deleted = await Tool.findByIdAndDelete(id);
    return !!deleted;
  }
}
