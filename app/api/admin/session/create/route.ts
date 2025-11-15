import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { adminId } = await req.json();

  const res = NextResponse.json({ ok: true });

  // Set a secure HttpOnly cookie for 20 minutes
  res.cookies.set("adminSession", adminId, {
    httpOnly: true,
    maxAge: 60 * 20,
    path: "/",
  });

  return res;
}
