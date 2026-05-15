import { middlewareAuth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

export default middlewareAuth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = ["/", "/login", "/register"].includes(nextUrl.pathname);
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  if (isApiAuthRoute) return NextResponse.next();
  if (!isLoggedIn && !isPublicRoute && !isApiRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
