import mongoose from "mongoose";

const AuditSnapshotSchema = new mongoose.Schema(
  {
    // -------------------------------------------------------
    // 1. Storage Information
    // -------------------------------------------------------
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // -------------------------------------------------------
    // 2. Cycle Information
    // -------------------------------------------------------
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditCycle",
      required: true,
    },
    cycleNumber: { type: Number, required: true },

    // Link to the session that created this snapshot
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditSession",
      required: true,
    },

    // -------------------------------------------------------
    // 3. Timestamp
    // -------------------------------------------------------
    snapshotDate: { type: Date, default: Date.now },

    // -------------------------------------------------------
    // 4. Frozen Tool and ToolKit Data
    // These are DEEP COPIES, not references
    // -------------------------------------------------------
    toolData: [
      {
        type: Object,
      },
    ],

    toolKitData: [
      {
        type: Object,
      },
    ],

    // -------------------------------------------------------
    // 5. Summary Statistics
    // -------------------------------------------------------
    totalTools: { type: Number, default: 0 },
    presentTools: { type: Number, default: 0 },
    needsUpdateTools: { type: Number, default: 0 },
    missingTools: { type: Number, default: 0 },

    toolKitsAudited: { type: Number, default: 0 },
    toolKitsPending: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AuditSnapshot =
  mongoose.models.AuditSnapshot ||
  mongoose.model("AuditSnapshot", AuditSnapshotSchema);
