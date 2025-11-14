import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// ---------------------------------------------
// 1. Constants & Types
// ---------------------------------------------
export const AUDIT_FREQUENCIES = ["monthly", "quarterly", "custom"] as const;

export type AuditFrequency = (typeof AUDIT_FREQUENCIES)[number];

// ---------------------------------------------
// 2. Schema
// ---------------------------------------------
const AuditCycleSchema = new Schema(
  {
    // Storage Identification
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // Cycle State
    currentCycleNumber: { type: Number, default: 1 },
    isActiveCycle: { type: Boolean, default: true },

    // Supervisor Requirement
    requiresSupervisor: { type: Boolean, default: false },

    // Timing
    lastAuditDate: { type: Date, default: null },
    nextAuditDue: { type: Date, default: null },

    // Audit Frequency
    frequency: {
      type: String,
      enum: AUDIT_FREQUENCIES,
      default: "monthly",
    },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 3. Infer document type from schema
// ---------------------------------------------
export type AuditCycleDocument = InferSchemaType<typeof AuditCycleSchema>;

// ---------------------------------------------
// 4. Model Export (prevents recompile issues)
// ---------------------------------------------
export const AuditCycle: Model<AuditCycleDocument> =
  mongoose.models.AuditCycle ||
  mongoose.model<AuditCycleDocument>("AuditCycle", AuditCycleSchema);
