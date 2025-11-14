import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// ---------------------------------------------
// 1. Schema
// ---------------------------------------------
const AuditSnapshotSchema = new Schema(
  {
    // 1. Storage Information
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // 2. Cycle Information
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "AuditCycle",
      required: true,
    },
    cycleNumber: { type: Number, required: true },

    // Link to the session that created this snapshot
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "AuditSession",
      required: true,
    },

    // 3. Timestamp
    snapshotDate: { type: Date, default: Date.now },

    // 4. Frozen Tool and Toolkit Data (deep copies)
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

    // 5. Summary Statistics
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
  mongoose.model<AuditSnapshotDocument>("AuditSnapshot", AuditSnapshotSchema);
