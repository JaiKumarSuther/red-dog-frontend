"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";

const AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/otp-verification",
  "/create-password",
  "/onboarding",
];

function usesAuthLayout(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  return AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function ConditionalAppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (usesAuthLayout(pathname)) {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
