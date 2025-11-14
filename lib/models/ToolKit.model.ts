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

const NoteSchema = new Schema(
  {
    text: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Kit Contents
const KitContentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    eqNumber: { type: String, trim: true },
    qty: { type: Number, required: true, default: 1 },
    calDate: { type: Date, default: null },
    auditStatus: {
      type: String,
      enum: ["present", "needsUpdate", "pending"],
      default: "pending",
    }
  },
  { _id: true }
);

const ToolKitSchema = new Schema(
  {
    // Identification
    name: { type: String, required: true, trim: true },
    kitNumber: { type: String, required: true, unique: true, trim: true },
    qrCode: { type: String, required: true, trim: true },

    // Location
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },
    qrLocation: { type: String, required: true, trim: true },
    storageType: { type: String, required: true, trim: true },

    // Audit
    auditStatus: {
      type: String,
      enum: TOOLKIT_AUDIT_STATUSES,
      default: "pending",
    },
    lastAuditedAt: { type: Date, default: null },

    // CONTENTS ARE NOW SUB-DOCUMENTS
    contents: [KitContentSchema],

    notes: [NoteSchema],
  },
  { timestamps: true }
);

export type ToolKitDocument = InferSchemaType<typeof ToolKitSchema>;

export const ToolKit: Model<ToolKitDocument> =
  mongoose.models.ToolKit ||
  mongoose.model<ToolKitDocument>("ToolKit", ToolKitSchema);
