"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { RedDogLogo } from "@/components/RedDogLogo";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "/figmaAssets/svg-8.svg", path: "/dashboard" },
  { id: "matches", label: "Matches", icon: "/figmaAssets/svg-6.svg", path: "/matches" },
  { id: "applications", label: "Applications", icon: "/figmaAssets/svg-11.svg", path: "/applications" },
  { id: "tracker", label: "Tracker", icon: "/figmaAssets/svg-12.svg", path: "/tracker" },
  { id: "wins", label: "Win Database", icon: "/figmaAssets/svg-6.svg", path: "/wins" },
  { id: "settings", label: "Settings", icon: "/figmaAssets/svg-9.svg", path: "/settings" },
];

export const PrimaryNavigationMenuSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <nav className="z-[1] flex w-72 min-h-screen flex-col items-stretch self-stretch border-r border-solid border-[#1f1f1f] bg-[#0d0d0d]">
      {/* Logo / Brand Header */}
      <div className="h-20 items-center px-6 py-0 border-[#1f1f1f] flex self-stretch w-full border-b border-solid flex-shrink-0">
        <RedDogLogo dark />
      </div>

      {/* Menu */}
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
        <div className="flex w-full flex-col items-start gap-2.5 px-4 py-6">
          <div className="flex flex-col items-start px-2 py-0 self-stretch w-full flex-[0_0_auto]">
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#a6a6a6] text-xs tracking-[0.60px] leading-4">
              MENU
            </span>
          </div>

          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`flex gap-3 self-stretch w-full overflow-hidden items-center relative flex-[0_0_auto] cursor-pointer text-left transition-colors ${
                  active
                    ? "p-3 bg-[#ef3e341a] rounded-lg"
                    : "px-4 py-3 rounded-2xl"
                }`}
              >
                {active && (
                  <div className="absolute h-full top-0 left-0 w-1 bg-[#ef3e34] rounded-[0px_33554400px_33554400px_0px]" />
                )}

                <img
                  className="relative w-5 h-5 flex-shrink-0"
                  alt={item.label}
                  src={item.icon}
                />

                <span
                  className={`relative flex items-center w-fit mt-[-1.00px] [font-family:'Montserrat',Helvetica] text-base tracking-[0] leading-6 whitespace-nowrap ${
                    active
                      ? "font-bold text-[#ef3e34]"
                      : "font-medium text-[#a6a6a6]"
                  }`}
                >
                  {item.label}
                </span>

              </button>
            );
          })}
        </div>
      </div>

      {/* Sign Out section */}
      <div className="flex flex-col items-start p-4 self-stretch w-full flex-[0_0_auto] border-t border-solid border-[#1f1f1f]">
        <button
          onClick={handleSignOut}
          className="flex gap-3 p-3 self-stretch w-full rounded-lg items-center relative flex-[0_0_auto] cursor-pointer text-left hover:bg-[#ef3e341a] transition-colors"
        >
          <img className="relative w-5 h-5 flex-shrink-0" alt="Sign Out" src="/figmaAssets/svg-7.svg" />
          <span className="relative [font-family:'Montserrat',Helvetica] font-normal text-[#ef3e34] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
            Sign Out
          </span>
        </button>
      </div>
    </nav>
  );
};
