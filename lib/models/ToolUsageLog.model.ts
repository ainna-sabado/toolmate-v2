import mongoose, {
  Schema,
  InferSchemaType,
  Model,
  Types,
} from "mongoose";

// ---------------------------------------------
// 1. Action Enum
// ---------------------------------------------
export const TOOL_USAGE_ACTIONS = [
  "issued",
  "returned",
  "calibration-out",
  "calibration-in",
  "maintenance",
] as const;

export type ToolUsageAction = (typeof TOOL_USAGE_ACTIONS)[number];

// ---------------------------------------------
// 2. Schema Definition
// ---------------------------------------------
const ToolUsageLogSchema = new Schema(
  {
    // 1. Employee performing the action
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeName: { type: String, required: true, trim: true },

    // 2. Tool involved
    toolId: {
      type: Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
    },
    toolName: { type: String, required: true, trim: true },
    eqNumber: { type: String, required: true, trim: true },

    // 3. Action Type
    action: {
      type: String,
      enum: TOOL_USAGE_ACTIONS,
      required: true,
    },

    // 4. When the action occurred
    actionDate: { type: Date, default: Date.now },

    // 5. Optional notes
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 3. Infer Document Type
// ---------------------------------------------
export type ToolUsageLogDocument = InferSchemaType<
  typeof ToolUsageLogSchema
>;

// ---------------------------------------------
// 4. Model Export (Next.js-safe)
// ---------------------------------------------
export const ToolUsageLog: Model<ToolUsageLogDocument> =
  mongoose.models.ToolUsageLog ||
  mongoose.model<ToolUsageLogDocument>(
    "ToolUsageLog",
    ToolUsageLogSchema
  );
