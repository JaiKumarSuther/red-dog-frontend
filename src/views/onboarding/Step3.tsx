"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { onboardingStep3Schema, type OnboardingStep3FormValues } from "@/lib/validation-schemas";
import { RedDogLogo } from "@/components/RedDogLogo";
import { Wrench, AlertCircle, ChevronRight, CheckSquare } from "lucide-react";

const CHALLENGE_OPTIONS = [
  { id: "outdated_equipment", label: "Outdated equipment", icon: "🔧" },
  { id: "safety_concerns", label: "Safety concerns", icon: "⚠️" },
  { id: "slow_response_times", label: "Slow response times", icon: "⏱️" },
  { id: "coverage_gaps", label: "Coverage gaps", icon: "📡" },
  { id: "communication_issues", label: "Communication issues", icon: "📻" },
  { id: "staffing_shortages", label: "Staffing shortages", icon: "👥" },
];

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

export const OnboardingStep3 = () => {
  const router = useRouter();
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [challengeError, setChallengeError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<OnboardingStep3FormValues>({
    resolver: zodResolver(onboardingStep3Schema),
    defaultValues: { biggestChallenge: "", urgencyStatement: "" },
  });

  const biggestChallengeVal = watch("biggestChallenge");
  const urgencyVal = watch("urgencyStatement");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("rdg_onboarding_step3");
      if (saved) {
        const parsed = JSON.parse(saved);
        reset({ biggestChallenge: parsed.biggestChallenge || "", urgencyStatement: parsed.urgencyStatement || "" });
        if (Array.isArray(parsed.challenges)) setSelectedChallenges(parsed.challenges);
      }
    } catch {}
  }, [reset]);

  const toggleChallenge = (id: string) => {
    setChallengeError("");
    setSelectedChallenges((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const onSubmit = (data: OnboardingStep3FormValues) => {
    if (selectedChallenges.length === 0) {
      setChallengeError("Please select at least one challenge");
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rdg_onboarding_step3", JSON.stringify({ ...data, challenges: selectedChallenges }));
    }
    router.push("/onboarding/step4");
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
        <ProgressBar step={3} total={4} />

        {/* Header */}
        <div className="flex flex-col gap-1 pb-1 border-b border-[#f3f4f6]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff4f4]">
              <Wrench className="h-4 w-4 text-[#ef3e34]" />
            </div>
            <h1 className="[font-family:'Oswald',Helvetica] font-bold text-[#111827] text-xl tracking-[0.5px] uppercase">
              What challenge are you trying to solve?
            </h1>
          </div>
          <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280] ml-10">
            Select all that apply — this drives your grant match quality.
          </p>
        </div>

        {/* Challenge Checkboxes */}
        <div className="flex flex-col gap-2">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide flex items-center gap-1">
            <CheckSquare className="h-3 w-3" /> Select all that apply <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CHALLENGE_OPTIONS.map((item) => {
              const selected = selectedChallenges.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChallenge(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                    selected
                      ? "border-[#ef3e34] bg-[#fff4f4] ring-1 ring-[#ef3e34]/20"
                      : "border-[#e5e7eb] bg-white hover:border-[#ef3e34]/30 hover:bg-[#fafafa]"
                  )}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className={cn(
                    "[font-family:'Montserrat',Helvetica] text-sm font-medium",
                    selected ? "text-[#ef3e34]" : "text-[#374151]"
                  )}>
                    {item.label}
                  </span>
                  {selected && (
                    <span className="ml-auto h-4 w-4 rounded-full bg-[#ef3e34] flex items-center justify-center shrink-0">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {selectedChallenges.length > 0 && (
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
              {selectedChallenges.length} selected
            </p>
          )}
          {challengeError && <FieldError message={challengeError} />}
        </div>

        {/* Biggest Challenge */}
        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
            Describe your biggest challenge <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="relative">
            <Textarea
              placeholder="Our current system has coverage gaps that impact response times..."
              rows={4}
              {...register("biggestChallenge")}
              className={cn(
                "w-full rounded-lg border px-3 py-2 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] transition-colors resize-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3e34]/20 focus-visible:border-[#ef3e34]",
                errors.biggestChallenge ? "border-red-400 bg-red-50/40" : "border-[#e5e7eb] bg-white"
              )}
            />
            <span className={cn("absolute bottom-2 right-3 text-[10px]", (biggestChallengeVal?.length ?? 0) < 20 ? "text-red-400" : "text-[#9ca3af]")}>
              {biggestChallengeVal?.length ?? 0} / 20 min
            </span>
          </div>
          <FieldError message={errors.biggestChallenge?.message} />
        </div>

        {/* Urgency */}
        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-xs text-[#374151] uppercase tracking-wide">
            What happens if this is not solved? <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="relative">
            <Textarea
              placeholder="Without funding, we will be unable to respond effectively..."
              rows={3}
              {...register("urgencyStatement")}
              className={cn(
                "w-full rounded-lg border px-3 py-2 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] transition-colors resize-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef3e34]/20 focus-visible:border-[#ef3e34]",
                errors.urgencyStatement ? "border-red-400 bg-red-50/40" : "border-[#e5e7eb] bg-white"
              )}
            />
            <span className={cn("absolute bottom-2 right-3 text-[10px]", (urgencyVal?.length ?? 0) < 10 ? "text-red-400" : "text-[#9ca3af]")}>
              {urgencyVal?.length ?? 0} / 10 min
            </span>
          </div>
          <FieldError message={errors.urgencyStatement?.message} />
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-[#f3f4f6]">
          <button
            type="button"
            onClick={() => router.push("/onboarding/step2")}
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
