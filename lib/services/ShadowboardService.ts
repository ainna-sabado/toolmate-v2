import { Shadowboard, ShadowboardDocument } from "@/lib/models/Shadowboard.model";
import mongoose from "mongoose";

type StorageFilter = {
  scopeType: "storage";
  mainDepartment: string;
  mainStorageName: string;
  mainStorageCode: string;
  qrLocation?: string | null;
};

type ToolkitFilter = {
  scopeType: "toolkit";
  toolkitId: string;
};

type ShadowboardFilter = StorageFilter | ToolkitFilter;

export default class ShadowboardService {
  private static normalizeQrLocation(value?: string | null) {
    if (value === undefined) return undefined;
    if (!value || value.trim() === "") return null;
    return value.trim().toUpperCase();
  }

  private static normalizeOrder<T extends { order: number }>(items: T[]) {
    // Keep 0-based, stable, predictable
    return (items || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((item, index) => ({ ...item, order: index }));
  }

  static async list(filter: ShadowboardFilter): Promise<any[]> {
    if (filter.scopeType === "toolkit") {
      if (!mongoose.Types.ObjectId.isValid(filter.toolkitId)) return [];
      return Shadowboard.find({
        scopeType: "toolkit",
        toolkitId: new mongoose.Types.ObjectId(filter.toolkitId),
      })
        .lean()
        .sort({ updatedAt: -1 });
    }

    const query: any = {
      scopeType: "storage",
      mainDepartment: filter.mainDepartment,
      mainStorageName: filter.mainStorageName,
      mainStorageCode: filter.mainStorageCode,
    };

    if (filter.qrLocation !== undefined) {
      query.qrLocation = this.normalizeQrLocation(filter.qrLocation);
    }

    return Shadowboard.find(query).lean().sort({ qrLocation: 1 });
  }

  static async getById(id: string): Promise<any | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Shadowboard.findById(id).lean();
  }

  static async create(data: Partial<ShadowboardDocument>): Promise<any> {
    const scopeType = (data.scopeType ?? "storage") as "storage" | "toolkit";

    if (scopeType === "toolkit") {
      if (!data.toolkitId) throw new Error("Missing toolkitId.");
    } else {
      if (!data.mainDepartment || !data.mainStorageName || !data.mainStorageCode) {
        throw new Error("Missing required storage identifiers.");
      }
    }

    const created = await Shadowboard.create({
      ...data,
      scopeType,
      qrLocation: scopeType === "storage" ? this.normalizeQrLocation(data.qrLocation) : undefined,
      images: this.normalizeOrder((data.images || []) as any),
      sequence: this.normalizeOrder((data.sequence || []) as any),
    });

    return created.toObject();
  }

  static async update(id: string, updates: Partial<ShadowboardDocument>): Promise<any | null> {
    const existing = await Shadowboard.findById(id);
    if (!existing) return null;

    // Allow title/description updates
    if (updates.title !== undefined) existing.title = updates.title as any;
    if (updates.description !== undefined) existing.description = updates.description as any;

    // Allow qrLocation update only on storage scope
    if (updates.qrLocation !== undefined && existing.scopeType === "storage") {
      existing.qrLocation = this.normalizeQrLocation(updates.qrLocation) as any;
    }

    if (updates.images) {
      existing.images = this.normalizeOrder(updates.images as any) as any;
    }

    if (updates.sequence) {
      existing.sequence = this.normalizeOrder(updates.sequence as any) as any;
    }

    existing.version = (existing.version ?? 1) + 1;
    await existing.save();

    return existing.toObject();
  }

  static async remove(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await Shadowboard.findByIdAndDelete(id);
    return !!res;
  }
}
