import mongoose, {
  Schema,
  InferSchemaType,
  Model,
  Types,
} from "mongoose";

// ---------------------------------------------
// 1. Audit Status Enum
// ---------------------------------------------
export const TOOLKIT_AUDIT_STATUSES = [
  "present",
  "needsUpdate",
  "pending",
] as const;

export type ToolKitAuditStatus = (typeof TOOLKIT_AUDIT_STATUSES)[number];

// ---------------------------------------------
// 2. Notes Sub-schema
// ---------------------------------------------
const NoteSchema = new Schema(
  {
    text: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ---------------------------------------------
// 3. ToolKit Schema
// ---------------------------------------------
const ToolKitSchema = new Schema(
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
      enum: TOOLKIT_AUDIT_STATUSES,
      default: "pending",
    },
    lastAuditedAt: { type: Date, default: null },

    // 4. Contents: Reference to Tool IDs
    contents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tool",
      },
    ],

    // 5. Notes
    notes: [NoteSchema],
  },
  { timestamps: true }
);

// ---------------------------------------------
// 4. Infer TS Document Type
// ---------------------------------------------
export type ToolKitDocument = InferSchemaType<typeof ToolKitSchema>;

// ---------------------------------------------
// 5. Model Export (Next.js-safe)
// ---------------------------------------------
export const ToolKit: Model<ToolKitDocument> =
  mongoose.models.ToolKit ||
  mongoose.model<ToolKitDocument>("ToolKit", ToolKitSchema);
