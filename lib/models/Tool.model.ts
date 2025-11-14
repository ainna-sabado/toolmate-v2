import mongoose, {
  Schema,
  InferSchemaType,
  Model,
  Types,
} from "mongoose";

// ---------------------------------------------
// 1. Status Constants & Types
// ---------------------------------------------
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

// ---------------------------------------------
// 2. Checkout Sub-schema (no _id)
// ---------------------------------------------
const CheckoutSchema = new Schema(
  {
    user: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    deptSection: { type: String, trim: true },
    date: { type: Date },
  },
  { _id: false }
);

// ---------------------------------------------
// 3. Notes Sub-schema
// ---------------------------------------------
const NoteSchema = new Schema(
  {
    text: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ---------------------------------------------
// 4. Main Tool Schema
// ---------------------------------------------
const ToolSchema = new Schema(
  {
    // 1. Identification
    name: { type: String, required: true, trim: true },
    eqNumber: { type: String, required: true, unique: true, trim: true },

    // 2. Status & Condition
    status: {
      type: String,
      enum: TOOL_STATUSES,
      default: "available",
    },
    dueDate: { type: Date, default: null },

    // 3. Audit Tracking
    auditStatus: {
      type: String,
      enum: AUDIT_STATUSES,
      default: "pending",
    },
    lastAuditedAt: { type: Date, default: null },

    // 4. Location Tracking
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },
    qrLocation: { type: String, required: true, trim: true },
    storageType: { type: String, required: true, trim: true },

    // 5. Checkout Tracking
    checkout: { type: CheckoutSchema, default: null },

    // 6. Maintenance & Notes
    notes: [NoteSchema],

    // 7. ToolKit Relationship
    toolKitId: { type: Schema.Types.ObjectId, ref: "ToolKit" },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 5. Infer TS Document Type
// ---------------------------------------------
export type ToolDocument = InferSchemaType<typeof ToolSchema>;

// ---------------------------------------------
// 6. Model Export (Next.js-safe)
// ---------------------------------------------
export const Tool: Model<ToolDocument> =
  mongoose.models.Tool ||
  mongoose.model<ToolDocument>("Tool", ToolSchema);
