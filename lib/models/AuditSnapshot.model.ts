import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// ---------------------------------------------
// 1. Schema — REAL AUDIT HISTORY
// ---------------------------------------------
const AuditSnapshotSchema = new Schema(
  {
    // ✅ Storage Information
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // ✅ Link to scheduling cycle (for reminder reference only)
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "AuditCycle",
      required: true,
    },

    // ✅ Sequential count of how many times this storage has EVER been audited
    // 1, 2, 3, 4, 5 → tech
    // 6 → supervisor required
    snapshotSequence: { type: Number, required: true },

    // ✅ Supervisor sign-off (REQUIRED every 6th snapshot)
    supervisor: {
      name: { type: String, trim: true },
      employeeId: { type: String, trim: true },
    },

    // ✅ Timestamp of the actual audit
    snapshotDate: { type: Date, default: Date.now },

    // ✅ Frozen Tool & Toolkit Data (EQ5044 source of truth)
    toolData: [{ type: Object }],
    toolKitData: [{ type: Object }],

    // ✅ Summary Statistics
    totalTools: { type: Number, default: 0 },
    presentTools: { type: Number, default: 0 },
    needsUpdateTools: { type: Number, default: 0 },
    missingTools: { type: Number, default: 0 },

    toolKitsAudited: { type: Number, default: 0 },
    toolKitsPending: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 2. Infer TS type from schema
// ---------------------------------------------
export type AuditSnapshotDocument = InferSchemaType<
  typeof AuditSnapshotSchema
>;

// ---------------------------------------------
// 3. Model Export (Next.js safe)
// ---------------------------------------------
export const AuditSnapshot: Model<AuditSnapshotDocument> =
  mongoose.models.AuditSnapshot ||
  mongoose.model<AuditSnapshotDocument>(
    "AuditSnapshot",
    AuditSnapshotSchema
  );
