import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import AdminService from "@/lib/services/AdminService";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { qrCodeValue, selectedDepartment } = await req.json();

    console.log("📥 API received:", { qrCodeValue, selectedDepartment });

    if (!qrCodeValue || !selectedDepartment) {
      console.log("❌ Missing payload");
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

      console.log("✅ Admin verified:", employee);

      return NextResponse.json({
        authorized: true,
        employee,
      });

    } catch (serviceError: any) {
      console.log("❌ Admin verify failed:", serviceError.message);

      return NextResponse.json(
        { error: serviceError.message },
        { status: 403 }
      );
    }

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
