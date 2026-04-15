"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function formatOptionLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export type CheckboxFilterDropdownProps = {
  /** Field label shown in the trigger and for a11y */
  label: string;
  options: string[];
  selected: string[];
  /** Toggles membership of a single option (same pattern as a chip toggle) */
  onToggle: (value: string) => void;
  onClearAll?: () => void;
  className?: string;
  triggerClassName?: string;
  dataTestId?: string;
};

export function CheckboxFilterDropdown({
  label,
  options,
  selected,
  onToggle,
  onClearAll,
  className,
  triggerClassName,
  dataTestId,
}: CheckboxFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const summary =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? formatOptionLabel(selected[0]!)
        : `${selected.length} selected`;

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            data-testid={dataTestId}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cn(
              "h-10 w-full min-w-0 justify-between gap-2 border-[#e5e7eb] bg-white px-3 text-left [font-family:'Montserrat',Helvetica] font-semibold text-sm text-[#111827] shadow-sm hover:bg-[#fafafa] hover:text-[#111827]",
              triggerClassName
            )}
          >
            <span className="min-w-0 truncate">
              <span className="font-medium text-[#9ca3af]">{label}: </span>
              <span>{summary}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(calc(100vw-2rem),20rem)] p-0 [font-family:'Montserrat',Helvetica]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-64 overflow-y-auto overscroll-contain p-1.5">
            {options.map((opt) => {
              const isOn = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
                >
                  <Checkbox
                    checked={isOn}
                    onCheckedChange={(checked) => {
                      if (Boolean(checked) !== isOn) onToggle(opt);
                    }}
                    className="border-[#d1d5db] data-[state=checked]:border-[#ef3e34] data-[state=checked]:bg-[#ef3e34] data-[state=checked]:text-white"
                  />
                  <span className="min-w-0 flex-1 leading-snug">{formatOptionLabel(opt)}</span>
                </label>
              );
            })}
          </div>
          {selected.length > 0 && onClearAll ? (
            <div className="border-t border-[#f0f0f0] p-2">
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                }}
                className="w-full rounded-md py-2 text-center text-xs font-semibold text-[#ef3e34] transition-colors hover:bg-[#fff4f4]"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
