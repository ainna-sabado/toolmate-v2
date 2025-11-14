// src/services/ToolKitService.ts
import mongoose from "mongoose";
import { ToolKit } from "@/lib/models/ToolKit.model";
import { Tool } from "@/lib/models/Tool.model";
import type { ToolKitDocument } from "@/lib/models/ToolKit.model";
import {
  TOOLKIT_STATUSES,
  TOOLKIT_AUDIT_STATUSES,
} from "@/lib/models/ToolKit.model";

export default class ToolKitService {
  /**
   * Create a new Toolkit
   */
  static async createToolKit(data: any): Promise<ToolKitDocument> {
    // ------------------------------------------------
    // 1. Required Fields
    // ------------------------------------------------
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

    // ------------------------------------------------
    // 2. Apply Defaults BEFORE trimming
    // ------------------------------------------------
    if (!data.status) data.status = "available";
    if (!data.auditStatus) data.auditStatus = "pending";
    if (!data.contents) data.contents = [];

    // ------------------------------------------------
    // 3. Trim ALL string fields
    // ------------------------------------------------
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === "string") {
        data[key] = data[key].trim();
      }
    });

    // ------------------------------------------------
    // 4. Validate Toolkit Status
    // ------------------------------------------------
    if (!TOOLKIT_STATUSES.includes(data.status)) {
      throw new Error(
        `Invalid toolkit status: "${
          data.status
        }". Allowed: ${TOOLKIT_STATUSES.join(", ")}"`
      );
    }

    // ------------------------------------------------
    // 5. Validate Toolkit Audit Status
    // ------------------------------------------------
    if (!TOOLKIT_AUDIT_STATUSES.includes(data.auditStatus)) {
      throw new Error(
        `Invalid toolkit auditStatus: "${
          data.auditStatus
        }". Allowed: ${TOOLKIT_AUDIT_STATUSES.join(", ")}"`
      );
    }

    // ------------------------------------------------
    // 6. Validate Contents
    // ------------------------------------------------
    if (Array.isArray(data.contents)) {
      for (const item of data.contents) {
        // Name is required
        if (!item.name) {
          throw new Error("Each kit content must include a name");
        }

        // Qty check
        if (item.qty && item.qty < 1) {
          throw new Error("Kit content qty must be >= 1");
        }

        // Trim content string fields
        ["name", "brand", "category", "eqNumber"].forEach((field) => {
          if (item[field] && typeof item[field] === "string") {
            item[field] = item[field].trim();
          }
        });

        // Validate audit status
        if (
          item.auditStatus &&
          !["present", "needsUpdate", "pending"].includes(item.auditStatus)
        ) {
          throw new Error(
            `Invalid content auditStatus "${item.auditStatus}". Allowed: present, needsUpdate, pending`
          );
        }

        // eqNumber uniqueness check
        if (item.eqNumber) {
          const existsInTools = await Tool.findOne({ eqNumber: item.eqNumber });
          const existsInKits = await ToolKit.findOne({
            "contents.eqNumber": item.eqNumber,
          });

          if (existsInTools || existsInKits) {
            throw new Error(
              `Duplicate eqNumber "${item.eqNumber}". It already exists in tools or another toolkit.`
            );
          }
        }
      }
    }

    // ------------------------------------------------
    // 7. Create Toolkit
    // ------------------------------------------------
    const toolkit = await ToolKit.create(data);
    return toolkit;
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
   * Add a content item to a toolkit
   */
  static async addContent(kitId: string, item: any): Promise<ToolKitDocument> {
    console.log("🔧 addContent called for kitId:", kitId);

    if (!item.name) throw new Error("Content item must include a name");

    if (item.qty && item.qty < 1) {
      throw new Error("qty must be >= 1");
    }

    // Trim string fields
    ["name", "brand", "category", "eqNumber"].forEach((field) => {
      if (item[field] && typeof item[field] === "string") {
        item[field] = item[field].trim();
      }
    });

    // Audit Status validation
    if (
      item.auditStatus &&
      !["present", "needsUpdate", "pending"].includes(item.auditStatus)
    ) {
      throw new Error(
        `Invalid auditStatus "${item.auditStatus}". Allowed: present, needsUpdate, pending`
      );
    }

    // eqNumber uniqueness check
    if (item.eqNumber) {
      const existsInTools = await Tool.findOne({ eqNumber: item.eqNumber });
      const existsInKits = await ToolKit.findOne({
        "contents.eqNumber": item.eqNumber,
      });

      if (existsInTools || existsInKits) {
        throw new Error(
          `Duplicate eqNumber "${item.eqNumber}". It already exists in tools or toolkits.`
        );
      }
    }

    // ✅ Make sure kitId is a valid ObjectId and log what happens
    if (!mongoose.Types.ObjectId.isValid(kitId)) {
      console.error("❌ Invalid kitId for ObjectId:", kitId);
      throw new Error("Invalid toolkit ID");
    }

    const kit = await ToolKit.findById(kitId);

    console.log("   🔎 findById result:", kit ? "FOUND" : "NOT FOUND");

    if (!kit) throw new Error("Toolkit not found");

    kit.contents.push(item);
    await kit.save();

    return kit;
  }
}
