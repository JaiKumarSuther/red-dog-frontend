"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { onboardingStep2Schema, type OnboardingStep2FormValues } from "@/lib/validation-schemas";
import { RedDogLogo } from "@/components/RedDogLogo";
import { Users, AlertCircle, ChevronRight } from "lucide-react";

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
    hasError ? "border-red-400 bg-red-50/40" : "border-[#e5e7eb] bg-white hover:border-[#d1d5db]"
  );

const SERVICE_AREA_OPTIONS = [
  { value: "local", label: "Local" },
  { value: "county", label: "County" },
  { value: "regional", label: "Regional" },
  { value: "statewide", label: "Statewide" },
];

const STAFF_OPTIONS = ["1-10", "11-25", "26-50", "50+"];

export const OnboardingStep2 = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<OnboardingStep2FormValues>({
    resolver: zodResolver(onboardingStep2Schema),
    defaultValues: {
      missionStatement: "",
      populationServed: "",
      serviceArea: undefined,
      staffSizeRange: undefined,
      annualVolume: "",
    },
  });

  const watchedServiceArea = watch("serviceArea");
  const watchedStaffSize = watch("staffSizeRange");
  const missionValue = watch("missionStatement");
  const [missionCount, setMissionCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("rdg_onboarding_step2");
      if (saved) {
        const parsed = JSON.parse(saved) as OnboardingStep2FormValues;
        reset(parsed);
        setMissionCount((parsed.missionStatement || "").length);
      }
    } catch {}
  }, [reset]);

  useEffect(() => {
    setMissionCount(missionValue?.length ?? 0);
  }, [missionValue]);

  const onSubmit = (data: OnboardingStep2FormValues) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rdg_onboarding_step2", JSON.stringify(data));
    }
    router.push("/onboarding/step3");
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
        <ProgressBar step={2} total={4} />

        {/* Header */}
        <div className="flex flex-col gap-1 pb-1 border-b border-[#f3f4f6]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff4f4]">
              <Users className="h-4 w-4 text-[#ef3e34]" />
            </div>
            <h1 className="[font-family:'Oswald',Helvetica] font-bold text-[#111827] text-xl tracking-[0.5px] uppercase">
              Who do you serve?
            </h1>
          </div>
          <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280] ml-10">
            Tell us about the community and scale of your operations.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
            Mission or Description <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="relative">
            <Textarea
              placeholder="We provide emergency services to our community..."
              rows={4}
              {...register("missionStatement", {
                onChange: (e) => setMissionCount(e.target.value.length),
              })}
              className={cn(
                "w-full rounded-lg border px-3 py-2 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] transition-colors resize-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3e34]/20 focus-visible:border-[#ef3e34]",
                errors.missionStatement ? "border-red-400 bg-red-50/40" : "border-[#e5e7eb] bg-white"
              )}
            />
            <span className={cn(
              "absolute bottom-2 right-3 text-[10px]",
              missionCount < 20 ? "text-red-400" : "text-[#9ca3af]"
            )}>
              {missionCount} / 20 min
            </span>
          </div>
          <FieldError message={errors.missionStatement?.message} />
        </div>

        {/* Population + Service Area */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
              Population Served <span className="text-[#ef3e34]">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 50000"
              {...register("populationServed")}
              className={inputCls(!!errors.populationServed)}
            />
            <FieldError message={errors.populationServed?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
              Service Area <span className="text-[#ef3e34]">*</span>
            </Label>
            <Select
              value={watchedServiceArea || undefined}
              onValueChange={(val) => setValue("serviceArea", val as OnboardingStep2FormValues["serviceArea"], { shouldValidate: isSubmitted })}
            >
              <SelectTrigger className={cn("h-10 rounded-lg [font-family:'Montserrat',Helvetica] text-sm", errors.serviceArea ? "border-red-400 bg-red-50/40" : "border-[#e5e7eb]")}>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_AREA_OPTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.serviceArea?.message} />
          </div>
        </div>

        {/* Staff Size — pill group */}
        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
            Staff Size <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="flex gap-2 flex-wrap">
            {STAFF_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue("staffSizeRange", s as OnboardingStep2FormValues["staffSizeRange"], { shouldValidate: isSubmitted })}
                className={cn(
                  "flex-1 min-w-[60px] rounded-lg border py-2 px-2 text-center [font-family:'Montserrat',Helvetica] text-xs font-semibold transition-all",
                  watchedStaffSize === s
                    ? "border-[#ef3e34] bg-[#fff4f4] text-[#ef3e34] ring-1 ring-[#ef3e34]/30"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#ef3e34]/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <FieldError message={errors.staffSizeRange?.message} />
        </div>

        {/* Annual Volume */}
        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
            Annual Volume
            <span className="ml-1.5 text-[10px] font-normal text-[#9ca3af] normal-case tracking-normal">(calls / clients / students — optional)</span>
          </Label>
          <Input
            type="text"
            placeholder="e.g. 5,000 calls per year"
            {...register("annualVolume")}
            className={inputCls(false)}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-[#f3f4f6]">
          <button
            type="button"
            onClick={() => router.push("/onboarding/step1")}
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
