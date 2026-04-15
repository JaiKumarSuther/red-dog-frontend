"use client";

import type { ReactNode } from "react";
import { AppShellLayout, type ShellMenuItem } from "./AppShellLayout";
import { useAuth } from "@/lib/AuthContext";

const menuItems: ShellMenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "/figmaAssets/svg-8.svg", path: "/dashboard" },
  { id: "opportunities", label: "Opportunities", icon: "/figmaAssets/svg-14.svg", path: "/opportunities" },
  { id: "matches", label: "Matches", icon: "/figmaAssets/svg-6.svg", path: "/matches" },
  { id: "applications", label: "Applications", icon: "/figmaAssets/svg-11.svg", path: "/applications" },
  { id: "funders", label: "Funders", icon: "/figmaAssets/svg-12.svg", path: "/funders" },
  { id: "alerts", label: "Alerts", icon: "/figmaAssets/svg-15.svg", path: "/alerts" },
  { id: "outreach", label: "Outreach", icon: "/figmaAssets/svg-3.svg", path: "/outreach" },
  { id: "followups", label: "Follow-ups", icon: "/figmaAssets/svg-11.svg", path: "/followups" },
  { id: "weekly-summary", label: "Weekly Summary", icon: "/figmaAssets/svg-3.svg", path: "/weekly-summary" },
  { id: "tracker", label: "Tracker", icon: "/figmaAssets/svg-6.svg", path: "/tracker" },
  { id: "wins", label: "Wins", icon: "/figmaAssets/svg-12.svg", path: "/wins" },
  { id: "settings", label: "Settings", icon: "/figmaAssets/svg-9.svg", path: "/settings" },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();

  return (
    <AppShellLayout
      menuItems={menuItems}
      activePathMatchesPrefix={false}
      user={user}
      onLogout={logout}
      signOutRedirectPath="/login"
      showAshleen
    >
      {children}
    </AppShellLayout>
  );
};
