import mongoose from "mongoose";

const ACTIONS = [
  "issued",
  "returned",
  "calibration-out",
  "calibration-in",
  "maintenance",
];

const ToolUsageLogSchema = new mongoose.Schema(
  {
    // ---------------------------------------------------------------
    // 1. Employee performing the action
    // ---------------------------------------------------------------
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeName: { type: String, required: true, trim: true },

    // ---------------------------------------------------------------
    // 2. Tool involved
    // ---------------------------------------------------------------
    toolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tool",
      required: true,
    },
    toolName: { type: String, required: true, trim: true },
    eqNumber: { type: String, required: true, trim: true },

    // ---------------------------------------------------------------
    // 3. Action Type
    // ---------------------------------------------------------------
    action: {
      type: String,
      enum: ACTIONS,
      required: true,
    },

    // ---------------------------------------------------------------
    // 4. When the action occurred
    // ---------------------------------------------------------------
    actionDate: { type: Date, default: Date.now },

    // ---------------------------------------------------------------
    // 5. Optional notes
    // ---------------------------------------------------------------
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const ToolUsageLog =
  mongoose.models.ToolUsageLog ||
  mongoose.model("ToolUsageLog", ToolUsageLogSchema);
