import mongoose, { Schema, InferSchemaType, Model } from "mongoose";
import crypto from "crypto";

// ---------------------------------------------------
// 1. Role list (machine-friendly identifiers)
// ---------------------------------------------------
export const EMPLOYEE_ROLES = ["supervisor", "cal-officer"] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

// ---------------------------------------------------
// 2. Schema Definition
// ---------------------------------------------------
const EmployeeSchema = new Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },

    // Unique employee ID
    employeeId: { type: String, required: true, unique: true, trim: true },

    // Automatically generated UUIDv4 stored as QR code value
    qrCodeValue: { type: String, unique: true, trim: true },

    // Department structure
    mainDepartment: { type: String, required: true, trim: true },
    subSection: { type: String, required: true, trim: true },

    // System admin flag
    isAdmin: { type: Boolean, default: false },

    /**
     * Functional access roles
     * Allowed values: ["supervisor", "cal-officer"]
     */
    roles: {
      type: [String],
      enum: EMPLOYEE_ROLES,
      default: [],
    },

    // Employment status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------
// 3. Pre-save Middleware — Auto-generate UUIDv4 if empty
// ---------------------------------------------------
EmployeeSchema.pre("save", function (next) {
  if (!this.qrCodeValue) {
    const employeeId = this.employeeId;
    const timestamp = Date.now();

    const payload = `${employeeId}.${timestamp}`;
    const signature = crypto
      .createHmac("sha512", process.env.QR_SECRET!)
      .update(payload)
      .digest("hex");

    this.qrCodeValue = `${payload}.${signature}`;
  }

  next();
});

// ---------------------------------------------------
// 4. Type Inference
// ---------------------------------------------------
export type EmployeeDocument = InferSchemaType<typeof EmployeeSchema>;

// ---------------------------------------------------
// 5. Hot Reload Safe Export
// ---------------------------------------------------
export const Employee: Model<EmployeeDocument> =
  mongoose.models.Employee ||
  mongoose.model<EmployeeDocument>("Employee", EmployeeSchema);
