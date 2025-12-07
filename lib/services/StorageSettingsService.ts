// lib/services/StorageSettingsService.ts
import { StorageType } from "@/lib/models/StorageType.model";
import type { StorageTypeDocument } from "@/lib/models/StorageType.model";
import { StorageLocation } from "@/lib/models/StorageLocation.model";
import type { StorageLocationDocument } from "@/lib/models/StorageLocation.model";

export default class StorageSettingsService {
  // -------------------------------
  // STORAGE TYPES
  // -------------------------------
  static async listStorageTypes(): Promise<StorageTypeDocument[]> {
    return await StorageType.find({}).sort({ name: 1 }).lean();
  }

  static async createStorageType(data: {
    name: string;
    description?: string;
  }): Promise<StorageTypeDocument> {
    const name = (data.name || "").trim();
    if (!name) {
      throw new Error("Storage type name is required");
    }

    // Avoid duplicates (case-insensitive-ish)
    const existing = await StorageType.findOne({
      name: new RegExp(`^${name}$`, "i"),
    });
    if (existing) {
      throw new Error("Storage type already exists");
    }

    const doc = new StorageType({
      name,
      description: data.description?.trim() || "",
    });

    await doc.save();
    return doc.toObject();
  }

  // -------------------------------
  // STORAGE LOCATIONS (MAIN STORAGE)
  // -------------------------------
  static async listStorageLocations(mainDepartment: string) {
    if (!mainDepartment) {
      throw new Error("mainDepartment is required");
    }

    return await StorageLocation.find({ mainDepartment })
      .sort({ mainStorageName: 1, mainStorageCode: 1 })
      .lean();
  }

  static async createStorageLocation(data: {
    mainDepartment: string;
    mainStorageName: string;
    mainStorageCode: string;
    storageType: string;
  }): Promise<StorageLocationDocument> {
    const mainDepartment = (data.mainDepartment || "").trim();
    const mainStorageName = (data.mainStorageName || "").trim();
    const mainStorageCode = (data.mainStorageCode || "").trim();
    const storageType = (data.storageType || "").trim();

    if (!mainDepartment || !mainStorageName || !mainStorageCode || !storageType) {
      throw new Error("All fields are required");
    }

    const doc = new StorageLocation({
      mainDepartment,
      mainStorageName,
      mainStorageCode,
      storageType,
    });

    await doc.save(); // unique index will throw if duplicate
    return doc.toObject();
  }
}
