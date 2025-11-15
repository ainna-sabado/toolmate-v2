import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isAdminRoute = path.startsWith("/admin-access");
  const isLoginPage = path === "/admin-access";

  // Non admin-access route → ignore
  if (!isAdminRoute) return NextResponse.next();

  // Allow QR login page
  if (isLoginPage) return NextResponse.next();

  // Require adminSession cookie for all other routes
  const session = req.cookies.get("adminSession")?.value;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin-access"; // redirect to QR login
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-access/:path*"],
};
