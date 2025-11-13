import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },

    // Unique company employee ID
    employeeId: { type: String, required: true, unique: true, trim: true },

    // Encoded into QR
    qrCodeValue: { type: String, required: true, unique: true, trim: true },

    // Department structure
    mainDepartment: { type: String, required: true, trim: true },
    subSection: { type: String, required: true, trim: true },

    // Simple system-level access
    isAdmin: { type: Boolean, default: false },

    /**
     * Functional roles:
     * Example:
     * ["supervisor", "auditor"]
     *
     * Supervisor needed for 6th cycle confirmation.
     */
    roles: {
      type: [String],
      default: [],
    },

    // Employee is active/inactive
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Employee =
  mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
