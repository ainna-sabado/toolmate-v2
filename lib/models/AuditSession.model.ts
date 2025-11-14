import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// ---------------------------------------------
// 1. Session Status Enum
// ---------------------------------------------
export const SESSION_STATUSES = [
  "in-progress",
  "completed",
  "cancelled",
] as const;

export type AuditSessionStatus = (typeof SESSION_STATUSES)[number];

// ---------------------------------------------
// 2. Schema Definition
// ---------------------------------------------
const AuditSessionSchema = new Schema(
  {
    // 1. Storage being audited
    mainStorageName: { type: String, required: true, trim: true },
    mainStorageCode: { type: String, required: true, trim: true },

    // 2. Employee performing audit
    auditorId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    // 3. Cycle information
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "AuditCycle",
      required: true,
    },
    cycleNumber: { type: Number, required: true },
    requiresSupervisor: { type: Boolean, default: false },

    // 4. Audit tracking
    totalTools: { type: Number, required: true },
    auditedTools: { type: Number, default: 0 },
    pendingTools: { type: Number, default: 0 },

    auditedToolIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tool",
      },
    ],
    pendingToolIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tool",
      },
    ],

    // 5. Status
    status: {
      type: String,
      enum: SESSION_STATUSES,
      default: "in-progress",
    },

    // 6. Timing
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },

    // 7. Notes
    auditorNotes: { type: String, default: "" },
    supervisorNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 3. Infer TS type from schema
// ---------------------------------------------
export type AuditSessionDocument = InferSchemaType<typeof AuditSessionSchema>;

// ---------------------------------------------
// 4. Model Export (typed)
// ---------------------------------------------
export const AuditSession: Model<AuditSessionDocument> =
  mongoose.models.AuditSession ||
  mongoose.model<AuditSessionDocument>("AuditSession", AuditSessionSchema);
