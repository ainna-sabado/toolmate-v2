import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const StorageTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export type StorageTypeDocument = InferSchemaType<typeof StorageTypeSchema>;

export const StorageType: Model<StorageTypeDocument> =
  mongoose.models.StorageType ||
  mongoose.model<StorageTypeDocument>("StorageType", StorageTypeSchema);
