import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import AdminService from "@/lib/services/AdminService";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { qrCodeValue, selectedDepartment } = await req.json();

    console.log("📥 API received:", { qrCodeValue, selectedDepartment });

    // Basic validation
    if (!qrCodeValue || !selectedDepartment) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    try {
      const employee = await AdminService.verifyAdminAccess(
        qrCodeValue,
        selectedDepartment
      );

      console.log("✅ Admin verified:", employee._id);

      return NextResponse.json({
        authorized: true,
        employee,
      });
    } catch (serviceError) {
      console.log("❌ Admin access denied");

      // Generic error for security (never reveal reason)
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
