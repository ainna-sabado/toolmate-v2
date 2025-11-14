import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// ---------------------------------------------
// 1. Schema Definition
// ---------------------------------------------
const ShadowboardSchema = new Schema(
  {
    // Unique QR code location for a storage slot/drawer/shelf
    qrLocation: { type: String, required: true, unique: true, trim: true },

    // File path for the uploaded shadowboard image
    imagePath: { type: String, required: true, trim: true },

    // Versioning for updates
    version: { type: Number, default: 1 },

    // Employee who updated this image
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    updatedAt: { type: Date, default: Date.now },

    // Notes about the image
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 2. Infer TS Document Type
// ---------------------------------------------
export type ShadowboardDocument = InferSchemaType<typeof ShadowboardSchema>;

// ---------------------------------------------
// 3. Model Export (typed)
// ---------------------------------------------
export const Shadowboard: Model<ShadowboardDocument> =
  mongoose.models.Shadowboard ||
  mongoose.model<ShadowboardDocument>("Shadowboard", ShadowboardSchema);
