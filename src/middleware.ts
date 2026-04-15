import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AGENCY_PUBLIC = [
  "/login",
  "/signup",
  "/forgot-password",
  "/otp-verification",
  "/create-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/figmaAssets") ||
    pathname.includes(".") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const agencyToken = request.cookies.get("rdg_token")?.value;
  const adminToken = request.cookies.get("rdg_admin_token")?.value;
  const onboardingCookie = request.cookies.get("rdg_onboarding")?.value;

  const isAdminLogin = pathname === "/admin/login";
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminArea) {
    if (isAdminLogin) {
      if (adminToken) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      if (agencyToken) {
        const dest =
          onboardingCookie === "0" ? "/onboarding" : "/dashboard";
        return NextResponse.redirect(new URL(dest, request.url));
      }
      return NextResponse.next();
    }
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  const isAgencyPublic = AGENCY_PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (adminToken && isAgencyPublic) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (agencyToken && isAgencyPublic) {
    if (onboardingCookie === "0") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!agencyToken && !isAgencyPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (agencyToken && onboardingCookie === "0" && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (agencyToken && onboardingCookie === "1" && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
