import mongoose, { Schema, InferSchemaType, Model } from "mongoose";
import crypto from "crypto";

export const EMPLOYEE_ROLES = ["supervisor", "cal-officer"] as const;
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

const EmployeeSchema = new Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, unique: true, trim: true },

    // Full QR value (stored exactly)
    qrCodeValue: { type: String, unique: true, trim: true },

    mainDepartment: { type: String, required: true, trim: true },
    subSection: { type: String, required: true, trim: true },

    isAdmin: { type: Boolean, default: false },

    roles: {
      type: [String],
      enum: EMPLOYEE_ROLES,
      default: [],
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

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

export type EmployeeDocument = InferSchemaType<typeof EmployeeSchema>;

export const Employee: Model<EmployeeDocument> =
  mongoose.models.Employee ??
  mongoose.model<EmployeeDocument>("Employee", EmployeeSchema);
