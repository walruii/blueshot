import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/signin", "/auth/register", "/"];

  // Check if the route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }


  // Check if the route is under /app or other protected routes
  if (pathname.startsWith("/dashboard")) {
    try {
      // Get session from better-auth
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // If no session, redirect to signin
      if (!session) {
        return NextResponse.redirect(new URL("/auth/signin", request.url));
      }
    } catch (error) {
      // If there's an error getting the session, redirect to signin
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
