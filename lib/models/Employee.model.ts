import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// ---------------------------------------------
// 1. Optional: Define allowed role strings (future-proof)
// ---------------------------------------------
// You can expand this anytime as you add more roles.
export const EMPLOYEE_ROLES = ["supervisor", "auditor"] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

// ---------------------------------------------
// 2. Schema Definition
// ---------------------------------------------
const EmployeeSchema = new Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },

    // Unique employee ID (company reference)
    employeeId: { type: String, required: true, unique: true, trim: true },

    // QR-encoded value
    qrCodeValue: { type: String, required: true, unique: true, trim: true },

    // Department / structure
    mainDepartment: { type: String, required: true, trim: true },
    subSection: { type: String, required: true, trim: true },

    // Access level
    isAdmin: { type: Boolean, default: false },

    /**
     * Functional roles
     * Example: ["supervisor", "auditor"]
     */
    roles: {
      type: [String],
      default: [],
    },

    // Active/inactive employee
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---------------------------------------------
// 3. Infer TS type from Schema
// ---------------------------------------------
export type EmployeeDocument = InferSchemaType<typeof EmployeeSchema>;

// ---------------------------------------------
// 4. Model Export (Next.js Hot Reload Safe)
// ---------------------------------------------
export const Employee: Model<EmployeeDocument> =
  mongoose.models.Employee ||
  mongoose.model<EmployeeDocument>("Employee", EmployeeSchema);
