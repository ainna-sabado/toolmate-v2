import mongoose, { Schema, Document, Model } from "mongoose";

export interface ShadowboardImage {
  url: string; // can be https://... OR /public/path OR data:image/... base64
  label?: string;
  order: number;
}

export type ShadowboardSequenceItem =
  | {
      itemType: "tool";
      itemId: mongoose.Types.ObjectId;
      itemModel: "Tool";
      order: number;
    }
  | {
      itemType: "toolkit";
      itemId: mongoose.Types.ObjectId;
      itemModel: "ToolKit";
      order: number;
    }
  | {
      itemType: "kitContent";
      parentKitId: mongoose.Types.ObjectId;
      kitContentId: mongoose.Types.ObjectId;
      order: number;
    };

export type ShadowboardScopeType = "storage" | "toolkit";

export interface ShadowboardDocument extends Document {
  scopeType: ShadowboardScopeType;

  // storage scope identifiers
  mainDepartment?: string;
  mainStorageName?: string;
  mainStorageCode?: string;
  qrLocation?: string | null;

  // toolkit scope identifier
  toolkitId?: mongoose.Types.ObjectId;

  title?: string;
  description?: string;

  images: ShadowboardImage[];
  sequence: ShadowboardSequenceItem[];

  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShadowboardImageSchema = new Schema<ShadowboardImage>(
  {
    url: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const ShadowboardSequenceSchema = new Schema(
  {
    itemType: {
      type: String,
      enum: ["tool", "toolkit", "kitContent"],
      required: true,
    },

    // tool/toolkit
    itemId: {
      type: Schema.Types.ObjectId,
      required: function (this: any) {
        return this.itemType === "tool" || this.itemType === "toolkit";
      },
      refPath: "sequence.itemModel",
    },
    itemModel: {
      type: String,
      enum: ["Tool", "ToolKit"],
      required: function (this: any) {
        return this.itemType === "tool" || this.itemType === "toolkit";
      },
    },

    // kitContent
    parentKitId: {
      type: Schema.Types.ObjectId,
      required: function (this: any) {
        return this.itemType === "kitContent";
      },
      ref: "ToolKit",
    },
    kitContentId: {
      type: Schema.Types.ObjectId,
      required: function (this: any) {
        return this.itemType === "kitContent";
      },
    },

    order: { type: Number, required: true },
  },
  { _id: false }
);

const ShadowboardSchema = new Schema<ShadowboardDocument>(
  {
    scopeType: {
      type: String,
      enum: ["storage", "toolkit"],
      default: "storage",
      index: true,
    },

    // storage identifiers
    mainDepartment: { type: String, trim: true, index: true },
    mainStorageName: { type: String, trim: true },
    mainStorageCode: { type: String, trim: true },
    qrLocation: { type: String, default: null, trim: true },

    // toolkit identifier
    toolkitId: { type: Schema.Types.ObjectId, ref: "ToolKit", index: true },

    title: { type: String, trim: true },
    description: { type: String, trim: true },

    images: { type: [ShadowboardImageSchema], default: [] },
    sequence: { type: [ShadowboardSequenceSchema], default: [] },

    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// ✅ One shadowboard per storage+location
ShadowboardSchema.index(
  {
    scopeType: 1,
    mainDepartment: 1,
    mainStorageName: 1,
    mainStorageCode: 1,
    qrLocation: 1,
  },
  {
    unique: true,
    partialFilterExpression: { scopeType: "storage" },
  }
);

// ✅ One shadowboard per toolkit
ShadowboardSchema.index(
  {
    scopeType: 1,
    toolkitId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { scopeType: "toolkit" },
  }
);

export const Shadowboard: Model<ShadowboardDocument> =
  mongoose.models.Shadowboard ||
  mongoose.model<ShadowboardDocument>("Shadowboard", ShadowboardSchema);
