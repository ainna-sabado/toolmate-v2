import { Employee } from "@/lib/models/Employee.model";

export default class AdminService {
  static async verifyAdminAccess(qrCodeValue: string, department: string) {
    console.log("🔍 Verifying admin access:", { qrCodeValue, department });

    const employee = await Employee.findOne({ qrCodeValue }).lean();

    if (!employee)
      throw new Error("Employee not found");

    const validationRules: [boolean, string][] = [
      [employee.isAdmin, "Not an admin"],
      [employee.isActive, "Employee inactive"],
      [employee.mainDepartment === department, "Department mismatch"],
    ];

    for (const [valid, message] of validationRules) {
      if (!valid) throw new Error(message);
    }

    console.log("✔ Admin verified:", employee._id);
    return employee;
  }
}
