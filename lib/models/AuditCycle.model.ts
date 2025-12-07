import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// ---------------------------------------------
// 1. Constants & Types
// ---------------------------------------------
export const AUDIT_FREQUENCIES = ["monthly", "quarterly", "custom"] as const;
export type AuditFrequency = (typeof AUDIT_FREQUENCIES)[number];

export const AUDIT_CYCLE_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "overdue",
] as const;

export type AuditCycleStatus = (typeof AUDIT_CYCLE_STATUSES)[number];

// ---------------------------------------------
// 2. Schema — SCHEDULING ONLY
// ---------------------------------------------
const AuditCycleSchema = new Schema(
  {
    // ✅ Storage identification
    mainDepartment: { type: String, required: true, trim: true },
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },
    storageType: { type: String, required: true, trim: true },

    // ✅ Audit scheduling config
    frequency: {
      type: String,
      enum: AUDIT_FREQUENCIES,
      default: "monthly",
    },

    // ✅ How many REQUIRED audits per year
    // monthly = 12, quarterly = 4, custom = any value
    maxCycles: { type: Number, default: 12 },

    // ✅ How many required cycles have been satisfied so far
    cycleNumber: { type: Number, default: 0 },

    // ✅ Reminder / scheduling dates
    nextAuditDate: { type: Date, required: true },
    lastAuditDate: { type: Date, default: null },

    // ✅ High-level scheduling status
    status: {
      type: String,
      enum: AUDIT_CYCLE_STATUSES,
      default: "not_started",
    },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 3. Types & Model
// ---------------------------------------------
export type AuditCycleDocument = InferSchemaType<typeof AuditCycleSchema>;

export const AuditCycle: Model<AuditCycleDocument> =
  mongoose.models.AuditCycle ||
  mongoose.model<AuditCycleDocument>("AuditCycle", AuditCycleSchema);
