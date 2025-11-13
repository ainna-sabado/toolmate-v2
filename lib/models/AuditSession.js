import mongoose from "mongoose";

const SESSION_STATUSES = ["in-progress", "completed", "cancelled"];

const AuditSessionSchema = new mongoose.Schema(
  {
    // ------------------------------------------------
    // 1. Storage being audited
    // ------------------------------------------------
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // ------------------------------------------------
    // 2. Employee performing the audit
    // ------------------------------------------------
    auditorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Optional supervisor (for every 6th audit cycle)
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    // ------------------------------------------------
    // 3. Cycle Information
    // ------------------------------------------------
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditCycle",
      required: true,
    },
    cycleNumber: { type: Number, required: true },

    // Whether this cycle requires supervisor approval
    requiresSupervisor: { type: Boolean, default: false },

    // ------------------------------------------------
    // 4. Audit Progress Tracking
    // ------------------------------------------------
    totalTools: { type: Number, required: true },
    auditedTools: { type: Number, default: 0 },
    pendingTools: { type: Number, default: 0 },

    auditedToolIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tool",
      },
    ],
    pendingToolIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tool",
      },
    ],

    // ------------------------------------------------
    // 5. Status
    // ------------------------------------------------
    status: {
      type: String,
      enum: SESSION_STATUSES,
      default: "in-progress",
    },

    // ------------------------------------------------
    // 6. Timing
    // ------------------------------------------------
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },

    // ------------------------------------------------
    // 7. Notes
    // ------------------------------------------------
    auditorNotes: { type: String, default: "" },
    supervisorNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const AuditSession =
  mongoose.models.AuditSession ||
  mongoose.model("AuditSession", AuditSessionSchema);
