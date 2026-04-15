"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileFilterOption = { value: string; label: string };

type MobileFilterSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: MobileFilterOption[];
  ariaLabel: string;
  label?: string;
  dataTestId?: string;
  className?: string;
};

/** Native select, visible only below `md`. Pair with `hidden md:flex` for desktop filter chips. */
export function MobileFilterSelect({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  label,
  dataTestId,
  className,
}: MobileFilterSelectProps) {
  const selectId = id ?? `mobile-filter-${ariaLabel.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={cn("w-full md:hidden", className)}>
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-1.5 block [font-family:'Montserrat',Helvetica] text-xs font-medium text-[#6b7280]"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={selectId}
          data-testid={dataTestId}
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#e5e7eb] bg-white py-2 pl-3 pr-10 [font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-1 focus:ring-[#ef3e34]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
          aria-hidden
        />
      </div>
    </div>
  );
}
