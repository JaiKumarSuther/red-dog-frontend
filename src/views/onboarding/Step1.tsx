"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { onboardingStep1Schema, type OnboardingStep1FormValues } from "@/lib/validation-schemas";
import { RedDogLogo } from "@/components/RedDogLogo";
import { US_STATES } from "@/lib/constants";
import { Building2, MapPin, Globe, ChevronRight, AlertCircle } from "lucide-react";

const ORG_TYPES = [
  { value: "police", label: "Police" },
  { value: "fire", label: "Fire" },
  { value: "ems", label: "EMS" },
  { value: "school", label: "School" },
  { value: "healthcare", label: "Healthcare" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "municipality", label: "Municipality" },
  { value: "other", label: "Other" },
];

// ── Shared sub-components ──────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="flex flex-col gap-2 mb-2">
      <div className="flex items-center justify-between">
        <span className="[font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">
          Step {step} of {total}
        </span>
        <span className="[font-family:'Montserrat',Helvetica] text-xs font-bold text-[#ef3e34]">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#f3f4f6] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#ef3e34] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 [font-family:'Montserrat',Helvetica] text-xs text-red-600 mt-0.5">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

const inputCls = (hasError?: boolean) =>
  cn(
    "h-10 w-full rounded-lg border px-3 py-2 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3e34]/20 focus-visible:border-[#ef3e34]",
    hasError
      ? "border-red-400 bg-red-50/40"
      : "border-[#e5e7eb] bg-white hover:border-[#d1d5db]"
  );

// ── Component ──────────────────────────────────────────────────────────────

export const OnboardingStep1 = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<OnboardingStep1FormValues>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: {
      organizationName: "",
      organizationType: undefined,
      city: "",
      state: "",
      county: "",
      website: "",
    },
  });

  const watchedState = watch("state");
  const watchedOrgType = watch("organizationType");
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("rdg_onboarding_step1");
      if (saved) {
        const parsed = JSON.parse(saved) as OnboardingStep1FormValues;
        reset(parsed);
        setCharCount((parsed.organizationName || "").length);
      }
    } catch {}
  }, [reset]);

  const onSubmit = (data: OnboardingStep1FormValues) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rdg_onboarding_step1", JSON.stringify(data));
    }
    router.push("/onboarding/step2");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#fafafa] px-4 pb-12 pt-6 sm:pt-8">
      <div className="mb-8 self-start">
        <RedDogLogo />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-[540px] flex-col gap-5 rounded-2xl border border-[#f0f0f0] bg-white px-5 py-7 shadow-[0_8px_40px_rgba(0,0,0,0.08)] sm:px-8 sm:py-8"
        noValidate
      >
        <ProgressBar step={1} total={4} />

        {/* Header */}
        <div className="flex flex-col gap-1 pb-1 border-b border-[#f3f4f6]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff4f4]">
              <Building2 className="h-4 w-4 text-[#ef3e34]" />
            </div>
            <h1 className="[font-family:'Oswald',Helvetica] font-bold text-[#111827] text-xl tracking-[0.5px] uppercase">
              Tell us about your organization
            </h1>
          </div>
          <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280] ml-10">
            This helps us find the most relevant funding opportunities for you.
          </p>
        </div>

        {/* Organization Name */}
        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
            Organization Name <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="relative">
            <Input
              type="text"
              {...register("organizationName", {
                onChange: (e) => setCharCount(e.target.value.length),
              })}
              placeholder="e.g. Jamshoro Fire Department"
              className={inputCls(!!errors.organizationName)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9ca3af]">
              {charCount}/200
            </span>
          </div>
          <FieldError message={errors.organizationName?.message} />
        </div>

        {/* Organization Type */}
        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
            Organization Type <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {ORG_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue("organizationType", t.value as OnboardingStep1FormValues["organizationType"], { shouldValidate: isSubmitted })}
                className={cn(
                  "rounded-lg border py-2 px-1 text-center [font-family:'Montserrat',Helvetica] text-xs font-semibold transition-all",
                  watchedOrgType === t.value
                    ? "border-[#ef3e34] bg-[#fff4f4] text-[#ef3e34] ring-1 ring-[#ef3e34]/30"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#ef3e34]/40 hover:text-[#ef3e34]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <FieldError message={errors.organizationType?.message} />
        </div>

        {/* City + State */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide flex items-center gap-1">
              <MapPin className="h-3 w-3" /> City <span className="text-[#ef3e34]">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. Austin"
              {...register("city")}
              className={inputCls(!!errors.city)}
            />
            <FieldError message={errors.city?.message} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
              State <span className="text-[#ef3e34]">*</span>
            </Label>
            <Select
              value={watchedState || undefined}
              onValueChange={(val) => setValue("state", val, { shouldValidate: isSubmitted })}
            >
              <SelectTrigger className={cn("h-10 border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm", errors.state && "border-red-400 bg-red-50/40")}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {US_STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.state?.message} />
          </div>
        </div>

        {/* County + Website */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
              County <span className="text-[#ef3e34]">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. Travis County"
              {...register("county")}
              className={inputCls(!!errors.county)}
            />
            <FieldError message={errors.county?.message} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide flex items-center gap-1">
              <Globe className="h-3 w-3" /> Website
              <span className="ml-1 text-[10px] font-normal text-[#9ca3af] normal-case tracking-normal">(optional)</span>
            </Label>
            <Input
              type="text"
              placeholder="https://yourorg.gov"
              {...register("website")}
              className={inputCls(!!errors.website)}
            />
            <FieldError message={errors.website?.message} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-[#f3f4f6]">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#6b7280] hover:text-[#374151] transition-colors order-2 sm:order-1 text-center sm:text-left"
          >
            ← Back
          </button>
          <button
            type="submit"
            className="order-1 sm:order-2 flex items-center justify-center gap-2 rounded-lg bg-[#ef3e34] px-6 py-2.5 [font-family:'Montserrat',Helvetica] font-bold text-sm text-white shadow-sm transition-all hover:bg-[#d9382e] hover:shadow-md active:scale-[0.98]"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
