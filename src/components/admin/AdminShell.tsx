"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { AppShellLayout, type ShellMenuItem } from "@/components/AppShellLayout";

const ADMIN_MENU: ShellMenuItem[] = [
  { id: "admin-dashboard", label: "Dashboard", icon: "/figmaAssets/svg-8.svg", path: "/admin/dashboard" },
  { id: "admin-activity", label: "Activity", icon: "/figmaAssets/svg-15.svg", path: "/admin/activity" },
  { id: "admin-agencies", label: "Agencies", icon: "/figmaAssets/svg-10.svg", path: "/admin/agencies" },
  { id: "admin-opportunities", label: "Opportunities", icon: "/figmaAssets/svg-14.svg", path: "/admin/opportunities" },
  { id: "admin-funders", label: "Funders", icon: "/figmaAssets/svg-12.svg", path: "/admin/funders" },
  { id: "admin-matches", label: "Matches", icon: "/figmaAssets/svg-6.svg", path: "/admin/matches" },
  { id: "admin-applications", label: "Applications", icon: "/figmaAssets/svg-11.svg", path: "/admin/applications" },
  { id: "admin-users", label: "Users", icon: "/figmaAssets/svg-5.svg", path: "/admin/users" },
  { id: "admin-settings", label: "Settings", icon: "/figmaAssets/svg-9.svg", path: "/admin/settings" },
];

function chunkLoadFailedMessage(msg: string) {
  return (
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module")
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAdminAuth();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const STORAGE_KEY = "rdg_admin_chunk_reload_at";
    const cooldownMs = 8000;

    const tryReload = () => {
      const last = Number(sessionStorage.getItem(STORAGE_KEY) || "0");
      if (Date.now() - last < cooldownMs) return;
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
      window.location.reload();
    };

    const onWindowError = (e: ErrorEvent) => {
      if (chunkLoadFailedMessage(String(e.message || ""))) tryReload();
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      const msg = r instanceof Error ? r.message : String(r);
      if (chunkLoadFailedMessage(msg)) tryReload();
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-[#6b7280] [font-family:'Montserrat',Helvetica] text-sm">
        Checking session…
      </div>
    );
  }

  const shellUser = user
    ? {
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    : null;

  return (
    <AppShellLayout
      menuItems={ADMIN_MENU}
      activePathMatchesPrefix
      user={shellUser}
      onLogout={logout}
      signOutRedirectPath="/admin/login"
      headerSubtitle="Staff portal"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {children}
      </div>
    </AppShellLayout>
  );
}
