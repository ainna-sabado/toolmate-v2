import mongoose from "mongoose";

const AUDIT_STATUSES = ["present", "needsUpdate", "pending"];

// --------------------------------------
// ToolKit Schema
// --------------------------------------
const ToolKitSchema = new mongoose.Schema(
  {
    // 1. Identification
    name: { type: String, required: true, trim: true },
    kitNumber: { type: String, required: true, unique: true, trim: true },
    qrCode: { type: String, required: true, trim: true },

    // 2. Location Tracking
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },
    qrLocation: { type: String, required: true, trim: true },
    storageType: { type: String, required: true, trim: true },

    // 3. Audit Tracking
    auditStatus: {
      type: String,
      enum: AUDIT_STATUSES,
      default: "pending",
    },
    lastAuditedAt: { type: Date, default: null },

    // 4. Contents: Tools referenced by ID
    contents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tool",
      },
    ],

    // 5. Notes
    notes: [
      {
        text: { type: String, trim: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const ToolKit =
  mongoose.models.ToolKit || mongoose.model("ToolKit", ToolKitSchema);
