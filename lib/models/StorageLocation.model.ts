import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// --------------------------------------------------
// Subdocument: QR Location (row in shelf / drawer / section)
// --------------------------------------------------
const QrLocationSchema = new Schema(
  {
    rowName: {
      type: String,
      required: true,
      trim: true,
    },
    qrCode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: true, // keep _id so we can key rows
  }
);

// --------------------------------------------------
// Main storage definition
// --------------------------------------------------
const StorageLocationSchema = new Schema(
  {
    mainDepartment: {
      type: String,
      required: true,
      trim: true,
    },
    mainStorageName: {
      type: String,
      required: true,
      trim: true,
    },
    mainStorageCode: {
      type: String,
      required: true,
      trim: true,
    },
    storageType: {
      type: String, // e.g. "Roll Cabinet", "Shelf"
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // 🔹 Pre-defined row locations for this storage
    qrLocations: {
      type: [QrLocationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent duplicates per department
StorageLocationSchema.index(
  {
    mainDepartment: 1,
    mainStorageName: 1,
    mainStorageCode: 1,
  },
  { unique: true }
);

export type QrLocation = InferSchemaType<typeof QrLocationSchema>;
export type StorageLocationDocument = InferSchemaType<
  typeof StorageLocationSchema
>;

export const StorageLocation: Model<StorageLocationDocument> =
  mongoose.models.StorageLocation ||
  mongoose.model<StorageLocationDocument>(
    "StorageLocation",
    StorageLocationSchema
  );
