"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { onboardingStep4Schema, type OnboardingStep4FormValues } from "@/lib/validation-schemas";
import { RedDogLogo } from "@/components/RedDogLogo";
import api from "@/lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles } from "lucide-react";

const budgets = [
  { id: "under_25k", title: "Under $25K" },
  { id: "25k_50k", title: "$25K\u2013$50K" },
  { id: "50k_100k", title: "$50K\u2013$100K" },
  { id: "100k_plus", title: "$100K+" },
];

const timelines = [
  { id: "asap", title: "ASAP" },
  { id: "3_6_months", title: "3\u20136 months" },
  { id: "6_12_months", title: "6\u201312 months" },
];

// ── Auto-suggest helpers ────────────────────────────────────────────────────

const CHALLENGE_LABELS: Record<string, string> = {
  outdated_equipment: "Equipment Modernization",
  safety_concerns: "Safety Enhancement",
  slow_response_times: "Response Time Improvement",
  coverage_gaps: "Coverage Expansion",
  communication_issues: "Communications Upgrade",
  staffing_shortages: "Staffing & Workforce",
};

const TYPE_LABELS: Record<string, string> = {
  police: "Police", fire: "Fire Department", ems: "EMS",
  school: "School", healthcare: "Healthcare", nonprofit: "Nonprofit",
  municipality: "Municipality", other: "Public Safety",
  law_enforcement: "Law Enforcement", fire_services: "Fire Services",
  "911_centers": "911 Center", emergency_management: "Emergency Management",
};

function buildSuggestions(step1: any, step2: any, step3: any): string[] {
  const orgName = (step1?.organizationName || "").trim();
  const type = TYPE_LABELS[step1?.organizationType] || step1?.organizationType || "";
  const challenges: string[] = step3?.challenges || [];
  const area = step2?.serviceArea || "";
  const areaLabel = { local: "Local", county: "County-Wide", regional: "Regional", statewide: "Statewide" }[area as string] || "";

  const suggestions: string[] = [];

  // Per-challenge suggestions
  challenges.slice(0, 3).forEach((c) => {
    const challengeLabel = CHALLENGE_LABELS[c] || c.replace(/_/g, " ");
    if (orgName && type) {
      suggestions.push(`${orgName} ${challengeLabel} Project`);
    } else if (type) {
      suggestions.push(`${type} ${challengeLabel} Initiative`);
    } else {
      suggestions.push(`${challengeLabel} Improvement Project`);
    }
  });

  // Generic combos
  if (type && areaLabel) suggestions.push(`${areaLabel} ${type} Infrastructure Grant`);
  if (orgName && challenges.length === 0) suggestions.push(`${orgName} Operational Improvement Project`);
  if (type) suggestions.push(`${type} Technology & Equipment Upgrade`);

  // Dedupe and cap at 5
  return [...new Set(suggestions)].slice(0, 5);
}

// ── Component ───────────────────────────────────────────────────────────────

export const OnboardingStep4 = () => {
  const router = useRouter();
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [selectedTimeline, setSelectedTimeline] = useState<string>("");
  const [eligibilityType, setEligibilityType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingStep4FormValues>({
    resolver: zodResolver(onboardingStep4Schema),
    defaultValues: { projectTitle: "", specificRequest: "", whobenefits: "" },
  });

  const projectTitleValue = watch("projectTitle");

  // Load saved state + generate suggestions from earlier steps
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("rdg_onboarding_step4");
      if (saved) {
        const parsed = JSON.parse(saved);
        reset({
          projectTitle: parsed.projectTitle || "",
          specificRequest: parsed.specificRequest || "",
          whobenefits: parsed.whobenefits || "",
        });
        if (parsed.budgetRange) setSelectedBudget(parsed.budgetRange);
        if (parsed.timeline) setSelectedTimeline(parsed.timeline);
        if (parsed.eligibilityType) setEligibilityType(parsed.eligibilityType);
      }

      // Build suggestions from previous steps
      const step1 = JSON.parse(sessionStorage.getItem("rdg_onboarding_step1") || "{}");
      const step2 = JSON.parse(sessionStorage.getItem("rdg_onboarding_step2") || "{}");
      const step3 = JSON.parse(sessionStorage.getItem("rdg_onboarding_step3") || "{}");
      setSuggestions(buildSuggestions(step1, step2, step3));
    } catch {}
  }, [reset]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applySuggestion = (title: string) => {
    setValue("projectTitle", title, { shouldValidate: true });
    setShowSuggestions(false);
  };

  const onSubmit = async (data: OnboardingStep4FormValues) => {
    setErrorMsg("");
    if (!selectedBudget) { setErrorMsg("Please select a budget range."); return; }
    if (!selectedTimeline) { setErrorMsg("Please select a timeline."); return; }
    if (!eligibilityType) { setErrorMsg("Please select an eligibility type."); return; }

    const step4Data = {
      ...data,
      budgetRange: selectedBudget,
      timeline: selectedTimeline,
      eligibilityType,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("rdg_onboarding_step4", JSON.stringify(step4Data));
    }

    try {
      setIsSubmitting(true);
      const step1 = JSON.parse(sessionStorage.getItem("rdg_onboarding_step1") || "{}");
      const step2 = JSON.parse(sessionStorage.getItem("rdg_onboarding_step2") || "{}");
      const step3 = JSON.parse(sessionStorage.getItem("rdg_onboarding_step3") || "{}");

      const payload = {
        ...step1,
        ...step2,
        ...step3,
        ...step4Data,
        agencyTypes: step1.organizationType ? [step1.organizationType] : [],
        location: [step1.city, step1.state, step1.county].filter(Boolean).join(", "),
      };

      const res = await api.post("/onboarding/complete", payload);

      // Store result to pass it to results page
      sessionStorage.setItem("rdg_onboarding_results", JSON.stringify(res));

      router.push("/onboarding/results");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete onboarding. Please try again.");
      setIsSubmitting(false);
    }
  };

  const border = (name: keyof OnboardingStep4FormValues) =>
    cn(errors[name] && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500");

  const timelineClass = (id: string) =>
    `flex-1 py-2.5 px-3 rounded-lg border cursor-pointer transition-all text-center text-sm font-medium ${
      selectedTimeline === id
        ? "border-[#ef3e34] bg-[#fff4f4] text-[#ef3e34]"
        : "border-[#e5e7eb] bg-white hover:border-[#ef3e34]/40 text-[#111827]"
    }`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-4 pb-12 pt-6 sm:pt-8">
      <div className="mb-8 self-start">
        <RedDogLogo />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-[520px] flex-col gap-6 rounded-2xl border border-[#f0f0f0] bg-white px-4 py-6 shadow-[0_4px_32px_rgba(0,0,0,0.10)] sm:px-8 sm:py-8"
        noValidate
      >
        <div className="flex flex-col gap-1">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl tracking-[0.5px] uppercase">
            What do you need funding for?
          </h1>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Project Title with auto-suggest */}
        <div className="flex flex-col gap-1.5" ref={suggestionsRef}>
          <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Project Title <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="relative">
            <Input
              type="text"
              {...register("projectTitle")}
              className={cn("h-10 border-[#e5e7eb] rounded-lg text-sm pr-9", border("projectTitle"))}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowSuggestions((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ef3e34] hover:text-[#d9382e] transition-colors"
                title="Show AI suggestions"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white shadow-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-[#f3f4f6] flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#ef3e34]" />
                  <span className="[font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">
                    Suggested titles
                  </span>
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
                    className="w-full text-left px-3 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] hover:bg-[#fff4f4] hover:text-[#ef3e34] transition-colors border-b border-[#f9fafb] last:border-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.projectTitle && <p className="text-xs text-red-600">{errors.projectTitle.message}</p>}
          {suggestions.length > 0 && !projectTitleValue && (
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#ef3e34]" />
              Click the sparkle icon for AI-suggested titles based on your profile
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            What do you need funding for? <span className="text-[#ef3e34]">*</span>
          </Label>
          <Textarea
            rows={4}
            {...register("specificRequest")}
            className={cn("border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm resize-none focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34]", border("specificRequest"))}
          />
          {errors.specificRequest && (
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.specificRequest.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Estimated Budget <span className="text-[#ef3e34]">*</span>
          </Label>
          <Select value={selectedBudget || undefined} onValueChange={setSelectedBudget}>
            <SelectTrigger className="h-10 border-[#e5e7eb] rounded-lg">
              <SelectValue placeholder="Select Budget" />
            </SelectTrigger>
            <SelectContent>
              {budgets.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Timeline <span className="text-[#ef3e34]">*</span>
          </Label>
          <div className="flex w-full gap-2">
            {timelines.map((t) => (
              <div key={t.id} onClick={() => setSelectedTimeline(t.id)} className={timelineClass(t.id)}>
                {t.title}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Who benefits <span className="text-[#ef3e34]">*</span>
          </Label>
          <Input type="text" placeholder="Residents, responders, students, etc." {...register("whobenefits")} className={cn("h-10 border-[#e5e7eb] rounded-lg text-sm", border("whobenefits"))} />
          {errors.whobenefits && <p className="text-xs text-red-600">{errors.whobenefits.message}</p>}
        </div>

        <div className="flex flex-col gap-3">
          <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Eligibility type <span className="text-[#ef3e34]">*</span>
          </Label>
          <RadioGroup value={eligibilityType} onValueChange={setEligibilityType} className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nonprofit_501c3" id="nonprofit_501c3" />
              <Label htmlFor="nonprofit_501c3" className="font-normal text-sm">Nonprofit (501c3)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="government_agency" id="government_agency" />
              <Label htmlFor="government_agency" className="font-normal text-sm">Government agency</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" disabled={isSubmitting} onClick={() => router.push("/onboarding/step3")} className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#6b7280] hover:text-[#374151] transition-colors order-2 sm:order-1 text-center sm:text-left disabled:opacity-50">
            Back
          </button>
          <div className="flex flex-col sm:flex-row items-center gap-4 order-1 sm:order-2 w-full sm:w-auto">
            <span className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#9ca3af]">
              Step 4 of 4 (100%)
            </span>
            <button type="submit" disabled={isSubmitting} className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#ef3e34] px-6 py-2.5 [font-family:'Montserrat',Helvetica] font-semibold text-white transition-all hover:bg-[#d9382e] disabled:opacity-70">
              {isSubmitting ? "Submitting..." : "Find My Funding Matches"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
