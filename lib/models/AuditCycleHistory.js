import mongoose from "mongoose";

const AuditCycleHistorySchema = new mongoose.Schema(
  {
    // ---------------------------------------------
    // 1. Storage Information
    // ---------------------------------------------
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // ---------------------------------------------
    // 2. Cycle Information
    // ---------------------------------------------
    cycleNumber: { type: Number, required: true },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditCycle",
      required: true,
    },

    // ---------------------------------------------
    // 3. Personnel
    // ---------------------------------------------
    auditorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    auditorName: { type: String, required: true, trim: true },

    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    supervisorName: { type: String, default: "", trim: true },

    // ---------------------------------------------
    // 4. Timing
    // ---------------------------------------------
    completedAt: { type: Date, default: Date.now },

    // ---------------------------------------------
    // 5. Notes / Summary
    // ---------------------------------------------
    summaryNotes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const AuditCycleHistory =
  mongoose.models.AuditCycleHistory ||
  mongoose.model("AuditCycleHistory", AuditCycleHistorySchema);
