import { Employee } from "@/lib/models/Employee.model";

export default class AdminService {
  static async verifyAdminAccess(qrCodeValue: string, department: string) {
    console.log("🔍 Verifying admin:", { qrCodeValue, department });

    const employee = await Employee.findOne({ qrCodeValue }).lean();

    console.log("👤 DB lookup result:", employee);

    if (!employee) throw new Error("Employee not found");
    if (!employee.isAdmin) throw new Error("Not an admin");
    if (employee.mainDepartment !== department)
      throw new Error("Department mismatch");
    if (!employee.isActive) throw new Error("Employee inactive");

    return employee;
  }
}
