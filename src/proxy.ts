import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Every route except the login page and auth endpoints requires a session. */
export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|ico|webp)).*)",
  ],
};
