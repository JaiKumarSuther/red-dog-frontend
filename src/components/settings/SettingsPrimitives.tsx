"use client";

import type { ReactNode } from "react";

export const SettingsToggle = ({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    data-testid={`toggle-${id}`}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3e34]/30 ${checked ? "bg-[#22c55e]" : "bg-[#d1d5db]"}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
    />
  </button>
);

export const SettingsSectionCard = ({
  icon,
  title,
  subtitle,
  children,
  iconBg = "bg-[#fff4f4]",
  iconCls = "text-[#ef3e34]",
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  iconBg?: string;
  iconCls?: string;
}) => (
  <div className="rounded-xl border border-[#f0f0f0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]">
    <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-4 pb-4 pt-5 sm:px-6">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconCls}`}>
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="[font-family:'Oswald',Helvetica] text-sm font-bold uppercase tracking-[0.6px] text-[#111827]">
          {title}
        </span>
        <span className="[font-family:'Montserrat',Helvetica] text-xs font-normal text-[#9ca3af]">{subtitle}</span>
      </div>
    </div>
    <div className="px-4 py-5 sm:px-6">{children}</div>
  </div>
);
