import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/db";
import { Employee, EMPLOYEE_ROLES } from "@/lib/models/Employee.model";

export async function GET() {
  await connectDB();
  const employees = await Employee.find({});
  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // ----------------------------------------
    // 1. Normalize roles input
    // ----------------------------------------
    let roles = Array.isArray(body.roles) ? body.roles : [];

    // Convert all roles to lowercase, trim, unify
    roles = roles
      .map((r: string) => r.toLowerCase().trim())
      .map((r: string) => r.replace(/\s+/g, "-")); 

    // Remove duplicates
    roles = [...new Set(roles)];

    // ----------------------------------------
    // 2. Validate roles against allowed roles
    // ----------------------------------------
    const invalidRoles = roles.filter(
      (r: string) => !EMPLOYEE_ROLES.includes(r as any)
    );

    if (invalidRoles.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid role(s) detected.",
          invalidRoles,
          allowedRoles: EMPLOYEE_ROLES,
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // 3. Merge sanitized roles back into body
    // ----------------------------------------
    body.roles = roles;

    // ----------------------------------------
    // 4. Create employee
    // ----------------------------------------
    const employee = await Employee.create(body);

    return NextResponse.json(employee, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
}
