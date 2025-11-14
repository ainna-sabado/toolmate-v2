import mongoose, {
  Schema,
  InferSchemaType,
  Model,
} from "mongoose";

export const TOOLKIT_AUDIT_STATUSES = [
  "present",
  "needsUpdate",
  "pending",
] as const;

export const TOOLKIT_STATUSES = [
  "available",
  "in use",
  "for calibration",
  "damaged",
  "lost",
  "maintenance",
  "expired",
] as const;

// Notes
const NoteSchema = new Schema(
  {
    text: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

// -----------------------------------------------------
// Kit Content Sub-schema (embedded)
// -----------------------------------------------------
const KitContentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    brand: { type: String, trim: true },
    category: { type: String, trim: true },

    eqNumber: { type: String, trim: true },
    qty: { type: Number, required: true, default: 1 },

    calDate: { type: Date, default: null },

    // Only for audit, NOT for usage.
    auditStatus: {
      type: String,
      enum: ["present", "needsUpdate", "pending"],
      default: "pending",
    },
  },
  { _id: true }
);

// -----------------------------------------------------
// Main Toolkit Schema
// -----------------------------------------------------
const ToolKitSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    kitNumber: { type: String, required: true, unique: true, trim: true },
    qrCode: { type: String, required: true, trim: true },

    // Status (usage)
    status: {
      type: String,
      enum: TOOLKIT_STATUSES,
      default: "available",
    },

    // Audit tracking
    auditStatus: {
      type: String,
      enum: TOOLKIT_AUDIT_STATUSES,
      default: "pending",
    },
    lastAuditedAt: { type: Date, default: null },

    // Location
    mainDepartment: { type: String, required: true, trim: true },
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },
    qrLocation: { type: String, required: true, trim: true },
    storageType: { type: String, required: true, trim: true },

    // Contents
    contents: [KitContentSchema],

    // Notes
    notes: [NoteSchema],
  },
  { timestamps: true }
);

export type ToolKitDocument = InferSchemaType<typeof ToolKitSchema>;

export const ToolKit: Model<ToolKitDocument> =
  mongoose.models.ToolKit ||
  mongoose.model<ToolKitDocument>("ToolKit", ToolKitSchema);
