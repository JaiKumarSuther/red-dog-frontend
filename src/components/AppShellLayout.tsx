"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RedDogLogo } from "./RedDogLogo";
import { Menu } from "lucide-react";
import { AshleenChat } from "./AshleenChat";
import { cn } from "@/lib/utils";

/** Renders Figma SVGs as a monochrome mask so inactive = grey, active = brand red (fixes mixed stroke colors in assets). */
function SidebarNavIcon({ src, isActive }: { src: string; isActive: boolean }) {
  return (
    <div
      className={cn(
        "h-5 w-5 shrink-0 bg-[#a6a6a6] transition-colors duration-200 motion-reduce:transition-none",
        isActive && "bg-[#ef3e34]",
        !isActive && "group-hover:bg-[#c8c8c8]"
      )}
      style={{
        maskImage: `url("${src}")`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
      aria-hidden
    />
  );
}

export type ShellMenuItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string;
};

export type ShellUser = {
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
} | null;

type AppShellLayoutProps = {
  children: ReactNode;
  menuItems: ShellMenuItem[];
  /** When true, a path matches if it equals the item path or is nested under it (e.g. /admin/agencies/123). */
  activePathMatchesPrefix?: boolean;
  user: ShellUser;
  onLogout: () => void;
  signOutRedirectPath: string;
  /** Optional line under the logo (e.g. staff label). */
  headerSubtitle?: string;
  showAshleen?: boolean;
};

function pathIsActive(pathname: string, itemPath: string, prefix: boolean) {
  if (prefix) {
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  }
  return pathname === itemPath;
}

const SidebarContent = ({
  collapsed,
  menuItems,
  activePathMatchesPrefix,
  user,
  onLogout,
  signOutRedirectPath,
  headerSubtitle,
  onNavClick,
}: {
  collapsed: boolean;
  menuItems: ShellMenuItem[];
  activePathMatchesPrefix: boolean;
  user: ShellUser;
  onLogout: () => void;
  signOutRedirectPath: string;
  headerSubtitle?: string;
  onNavClick?: () => void;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const initials = user
    ? (user.firstName?.[0] ?? user.fullName?.[0] ?? user.email[0]).toUpperCase() +
      (user.lastName?.[0] ?? user.fullName?.split(" ")[1]?.[0] ?? "").toUpperCase()
    : "?";

  return (
    <>
      <div
        className={cn(
          "flex-shrink-0 border-b border-[#1f1f1f] px-4 min-w-0",
          collapsed ? "flex h-20 items-center" : headerSubtitle ? "flex flex-col gap-2.5 py-3.5" : "flex h-20 items-center"
        )}
      >
        {collapsed ? (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#ef3e34]">
            <span className="[font-family:'Oswald',Helvetica] text-sm font-bold tracking-[1px] text-white">RD</span>
          </div>
        ) : headerSubtitle ? (
          <>
            <RedDogLogo dark />
            <span className="inline-flex w-fit items-center rounded-full border border-[#ef3e34]/25 bg-[#ef3e34]/10 px-2.5 py-1 [font-family:'Montserrat',Helvetica] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#ff6b62]">
              {headerSubtitle}
            </span>
          </>
        ) : (
          <RedDogLogo dark />
        )}
      </div>

      <div className="flex w-full flex-col">
        <div className={`flex flex-col items-start gap-2.5 py-6 w-full ${collapsed ? "px-2" : "px-4"}`}>
          {!collapsed && (
            <div className="flex flex-col items-start px-2 self-stretch w-full">
              <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#a6a6a6] text-xs tracking-[0.60px] leading-4">
                MENU
              </span>
            </div>
          )}

          {menuItems.map((item) => {
            const isActive = pathIsActive(pathname, item.path, activePathMatchesPrefix);
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={onNavClick}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex w-full cursor-pointer items-center text-left no-underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#ef3e34]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]",
                  collapsed ? "justify-center rounded-lg p-3" : "gap-3 flex-[0_0_auto]",
                  isActive
                    ? collapsed
                      ? "rounded-lg bg-[#ef3e341a]"
                      : "rounded-lg bg-[#ef3e341a] p-3"
                    : collapsed
                      ? "rounded-lg hover:bg-[#ffffff0d]"
                      : "rounded-2xl px-4 py-3 hover:bg-[#ffffff0d]"
                )}
              >
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-[0px_33554400px_33554400px_0px] bg-[#ef3e34]" />
                )}
                <div className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  <SidebarNavIcon src={item.icon} isActive={isActive} />
                  {item.badge && collapsed && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <span className="[font-family:'Inter',Helvetica] font-bold text-[#ef3e34] text-[9px]">{item.badge}</span>
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span
                    className={`flex-1 [font-family:'Montserrat',Helvetica] text-base tracking-[0] leading-6 whitespace-nowrap ${isActive ? "font-bold text-[#ef3e34]" : "font-medium text-[#a6a6a6]"}`}
                  >
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <div className="relative inline-flex flex-shrink-0 flex-col items-start px-2 py-0.5 bg-white rounded-[33554400px]">
                    <div className="pointer-events-none absolute inset-0 rounded-[33554400px] bg-[#ffffff01] shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_#0000001a]" />
                    <span className="relative [font-family:'Inter',Helvetica] font-bold text-[#ef3e34] text-[10px] tracking-[0] leading-[15px] whitespace-nowrap">
                      {item.badge}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {user && (
        <div
          className={`flex items-center flex-shrink-0 border-t border-solid border-[#1f1f1f] ${collapsed ? "justify-center p-3" : "gap-3 px-5 py-4"}`}
        >
          <div className="w-8 h-8 rounded-full bg-[#ef3e34] flex items-center justify-center flex-shrink-0">
            <span className="[font-family:'Montserrat',Helvetica] font-bold text-white text-xs leading-none">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="[font-family:'Montserrat',Helvetica] font-semibold text-white text-sm leading-tight truncate">
                {(user.fullName ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()) || user.email}
              </span>
              <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-xs leading-tight truncate">
                {user.email}
              </span>
            </div>
          )}
        </div>
      )}

      <div
        className={`flex flex-col items-start self-stretch w-full flex-shrink-0 border-t border-solid border-[#1f1f1f] ${collapsed ? "p-2" : "p-4"}`}
      >
        <button
          type="button"
          onClick={() => {
            onLogout();
            router.push(signOutRedirectPath);
            onNavClick?.();
          }}
          title={collapsed ? "Sign Out" : undefined}
          aria-label="Sign out"
          className={`flex items-center cursor-pointer text-left w-full rounded-lg
            ${collapsed ? "justify-center p-3" : "gap-3 p-3"} hover:bg-[#ffffff0d]`}
        >
          <div
            className="h-5 w-5 shrink-0 bg-[#ef3e34]"
            style={{
              maskImage: "url(\"/figmaAssets/svg-7.svg\")",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: "url(\"/figmaAssets/svg-7.svg\")",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
            role="img"
            aria-hidden
          />
          {!collapsed && (
            <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#ef3e34] text-base tracking-[0] leading-6 whitespace-nowrap">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </>
  );
};

export function AppShellLayout({
  children,
  menuItems,
  activePathMatchesPrefix = false,
  user,
  onLogout,
  signOutRedirectPath,
  headerSubtitle,
  showAshleen = false,
}: AppShellLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-neutral-50">
      <nav className="z-10 hidden w-72 shrink-0 flex-col items-stretch self-stretch overflow-hidden border-r border-solid border-[#1f1f1f] bg-[#0d0d0d] min-h-screen lg:flex">
        <SidebarContent
          collapsed={false}
          menuItems={menuItems}
          activePathMatchesPrefix={activePathMatchesPrefix}
          user={user}
          onLogout={onLogout}
          signOutRedirectPath={signOutRedirectPath}
          headerSubtitle={headerSubtitle}
        />
      </nav>

      <nav className="z-10 hidden w-16 shrink-0 flex-col items-stretch self-stretch overflow-hidden border-r border-solid border-[#1f1f1f] bg-[#0d0d0d] min-h-screen md:flex lg:hidden">
        <SidebarContent
          collapsed
          menuItems={menuItems}
          activePathMatchesPrefix={activePathMatchesPrefix}
          user={user}
          onLogout={onLogout}
          signOutRedirectPath={signOutRedirectPath}
          headerSubtitle={headerSubtitle}
        />
      </nav>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <nav
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] w-72 flex-col overflow-hidden border-r border-[#1f1f1f] bg-[#0d0d0d] transition-transform duration-300 md:hidden
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent
          collapsed={false}
          menuItems={menuItems}
          activePathMatchesPrefix={activePathMatchesPrefix}
          user={user}
          onLogout={onLogout}
          signOutRedirectPath={signOutRedirectPath}
          headerSubtitle={headerSubtitle}
          onNavClick={() => setDrawerOpen(false)}
        />
      </nav>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-[#f0f0f0] bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            data-testid="button-hamburger"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e5e7eb] transition-colors hover:bg-[#f3f4f6]"
          >
            <Menu size={18} className="text-[#374151]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#ef3e34]">
              <span className="[font-family:'Oswald',Helvetica] text-xs font-bold text-white">RD</span>
            </div>
            <span className="[font-family:'Oswald',Helvetica] text-sm font-bold tracking-[0.5px] text-black">
              RED DOG RADIOS
            </span>
          </div>
        </div>

        <div className="min-w-0 w-full">{children}</div>
      </main>
      {showAshleen ? <AshleenChat /> : null}
    </div>
  );
}
