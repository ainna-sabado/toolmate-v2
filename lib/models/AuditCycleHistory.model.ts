import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// ---------------------------------------------
// 1. Schema Definition
// ---------------------------------------------
const AuditCycleHistorySchema = new Schema(
  {
    // 1. Storage Information
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // 2. Cycle Information
    cycleNumber: { type: Number, required: true },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "AuditCycle",
      required: true,
    },

    // 3. Personnel
    auditorId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    auditorName: { type: String, required: true, trim: true },

    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    supervisorName: { type: String, default: "", trim: true },

    // 4. Timing
    completedAt: { type: Date, default: Date.now },

    // 5. Summary / Notes
    summaryNotes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 2. Infer TypeScript Document Type
// ---------------------------------------------
export type AuditCycleHistoryDocument = InferSchemaType<
  typeof AuditCycleHistorySchema
>;

// ---------------------------------------------
// 3. Model Export
// ---------------------------------------------
export const AuditCycleHistory: Model<AuditCycleHistoryDocument> =
  mongoose.models.AuditCycleHistory ||
  mongoose.model<AuditCycleHistoryDocument>(
    "AuditCycleHistory",
    AuditCycleHistorySchema
  );
