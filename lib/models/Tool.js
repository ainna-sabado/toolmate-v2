import mongoose from "mongoose";

const STATUSES = [
  "available",
  "in use",
  "for calibration",
  "damaged",
  "lost",
  "maintenance",
  "expired",
];

const AUDIT_STATUSES = ["present", "needsUpdate", "pending"];

// --------------------------------------
// Checkout Sub-schema
// --------------------------------------
const CheckoutSchema = new mongoose.Schema(
  {
    user: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    deptSection: { type: String, trim: true },
    date: { type: Date },
  },
  { _id: false }
);

// --------------------------------------
// Main Tool Schema
// --------------------------------------
const ToolSchema = new mongoose.Schema(
  {
    // 1. Identification
    name: { type: String, required: true, trim: true },
    eqNumber: { type: String, required: true, unique: true, trim: true },

    // 2. Status & Condition
    status: {
      type: String,
      enum: STATUSES,
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
    mainStorageCode: { type: String, required: true, trim: true }, // ✔ NEW
    qrLocation: { type: String, required: true, trim: true },
    storageType: { type: String, required: true, trim: true },

    // 5. Checkout Tracking
    checkout: { type: CheckoutSchema, default: null },

    // 6. Maintenance & Notes
    notes: [
      {
        text: { type: String, trim: true },
        date: { type: Date, default: Date.now },
      },
    ],

    // 7. ToolKit Relationship
    toolKitId: { type: mongoose.Schema.Types.ObjectId, ref: "ToolKit" },
  },
  { timestamps: true }
);

export const Tool =
  mongoose.models.Tool || mongoose.model("Tool", ToolSchema);
