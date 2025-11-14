import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

export const TOOL_STATUSES = [
  "available",
  "in use",
  "for calibration",
  "damaged",
  "lost",
  "maintenance",
  "expired",
] as const;

export type ToolStatus = (typeof TOOL_STATUSES)[number];

export const AUDIT_STATUSES = ["present", "needsUpdate", "pending"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

// Notes sub-schema
const NoteSchema = new Schema(
  {
    text: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ---------------------------------------------
// UPDATED TOOL SCHEMA (brand + category added)
// ---------------------------------------------
const ToolSchema = new Schema(
  {
    // Identification
    name: { type: String, required: true, trim: true },

    brand: { type: String, trim: true },         // <-- ADDED
    category: { type: String, trim: true },      // <-- ADDED

    // eqNumber is optional
    eqNumber: { type: String, trim: true },

    qty: { type: Number, default: 1 },

    // Status
    status: {
      type: String,
      enum: TOOL_STATUSES,
      default: "available",
    },
    dueDate: { type: Date, default: null },

    // Audit
    auditStatus: {
      type: String,
      enum: AUDIT_STATUSES,
      default: "pending",
    },
    lastAuditedAt: { type: Date, default: null },

    // Location
    mainDepartment: { type: String, required: true, trim: true },
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },
    qrLocation: { type: String, required: true, trim: true },
    storageType: { type: String, required: true, trim: true },

    // Notes
    notes: [NoteSchema],

    // Toolkit relationship (optional)
    toolKitId: { type: Schema.Types.ObjectId, ref: "ToolKit" },
  },
  { timestamps: true }
);

export type ToolDocument = InferSchemaType<typeof ToolSchema>;

export const Tool: Model<ToolDocument> =
  mongoose.models.Tool || mongoose.model<ToolDocument>("Tool", ToolSchema);
