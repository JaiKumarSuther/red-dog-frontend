"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TagSelectProps = {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
};

export function TagSelect({
  label,
  options,
  selected,
  onChange,
  allowCustom = false,
  customPlaceholder = "Type custom value and press Enter...",
}: TagSelectProps) {
  const [customInput, setCustomInput] = useState("");

  const predefinedOptions = useMemo(() => Array.from(new Set(options)), [options]);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (!val || selected.includes(val)) return;
    onChange([...selected, val]);
    setCustomInput("");
  };

  const customValues = selected.filter((s) => !predefinedOptions.includes(s));

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}

      <div className="flex flex-wrap gap-1.5">
        {predefinedOptions.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                active
                  ? "border-[#ef3e34] bg-[#ef3e34] text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:border-[#ef3e34]/50"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {customValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customValues.map((val) => (
            <span
              key={val}
              className="flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
            >
              {val}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== val))}
                className="ml-0.5 text-blue-400 hover:text-blue-700 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {allowCustom && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={customPlaceholder}
            className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ef3e34]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            + Add
          </button>
        </div>
      )}

      {selected.length > 0 && <p className="text-xs text-gray-400">Selected: {selected.join(", ")}</p>}
    </div>
  );
}

/** Single-select category picker (radio-button style, but rendered as tags). */
export function CategorySelect({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-[#111827] [font-family:'Montserrat',Helvetica]">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? "" : opt)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors [font-family:'Montserrat',Helvetica]",
                active
                  ? "border-[#ef3e34] bg-[#ef3e34] text-white"
                  : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#ef3e34]/50"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
