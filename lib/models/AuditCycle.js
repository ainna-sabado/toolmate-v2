import mongoose from "mongoose";

const FREQUENCIES = ["monthly", "quarterly", "custom"];

const AuditCycleSchema = new mongoose.Schema(
  {
    // ---------------------------------------------------
    // 1. Storage Identification
    // ---------------------------------------------------
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // ---------------------------------------------------
    // 2. Cycle State
    // ---------------------------------------------------
    currentCycleNumber: { type: Number, default: 1 },
    isActiveCycle: { type: Boolean, default: true },

    // ---------------------------------------------------
    // 3. Supervisor Requirement
    // (Calculated after each audit based on cycle number)
    // ---------------------------------------------------
    requiresSupervisor: { type: Boolean, default: false },

    // ---------------------------------------------------
    // 4. Timing
    // ---------------------------------------------------
    lastAuditDate: { type: Date, default: null },
    nextAuditDue: { type: Date, default: null },

    // ---------------------------------------------------
    // 5. Audit Frequency (future-proof)
    // ---------------------------------------------------
    frequency: {
      type: String,
      enum: FREQUENCIES,
      default: "monthly",
    },
  },
  { timestamps: true }
);

export const AuditCycle =
  mongoose.models.AuditCycle ||
  mongoose.model("AuditCycle", AuditCycleSchema);
