import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isAdminRoute = path.startsWith("/admin-access");
  const isLoginPage = path === "/admin-access";

  // Only care about /admin-access routes
  if (!isAdminRoute) return NextResponse.next();

  // Allow the QR login page without a session
  if (isLoginPage) return NextResponse.next();

  // For everything else under /admin-access/* → require cookie
  const session = req.cookies.get("adminSession")?.value;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin-access"; // send to QR login
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-access/:path*"],
};
