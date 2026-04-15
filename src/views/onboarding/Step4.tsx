"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { onboardingStep4Schema, type OnboardingStep4FormValues } from "@/lib/validation-schemas";
import { RedDogLogo } from "@/components/RedDogLogo";

const OnboardingLogo = () => (
  <div className="mb-8 self-start">
    <RedDogLogo />
  </div>
);

const budgets = [
  { id: "under-25k", title: "Under $25K", sub: "Small equipment, training" },
  { id: "25k-100k", title: "$25K – $150K", sub: "Mid-size equipment, fleet" },
  { id: "100k-500k", title: "$100K – $500K", sub: "Large systems, vehicles" },
  { id: "500k-plus", title: "$500K+", sub: "Infrastructure, major systems" },
];

const timelines = [
  { id: "urgent", title: "Urgent" },
  { id: "planned", title: "Planned" },
];

export const OnboardingStep4 = () => {
  const router = useRouter();
  const [selectedBudget, setSelectedBudget] = useState<string>("under-25k");
  const [selectedTimeline, setSelectedTimeline] = useState<string>("urgent");
  const [populationServed, setPopulationServed] = useState<string>("");
  const [coverageArea, setCoverageArea] = useState<string>("");
  const [numberOfStaff, setNumberOfStaff] = useState<string>("");
  const [currentEquipment, setCurrentEquipment] = useState<string>("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnboardingStep4FormValues>({
    resolver: zodResolver(onboardingStep4Schema),
    defaultValues: { requestDescription: "" },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("rdg_onboarding_step4");
      if (saved) {
        const parsed = JSON.parse(saved) as {
          requestDescription?: string;
          budgetRange?: string;
          timeline?: string;
          populationServed?: string;
          coverageArea?: string;
          numberOfStaff?: string;
          currentEquipment?: string;
        };
        if (parsed.requestDescription) reset({ requestDescription: parsed.requestDescription });
        if (parsed.budgetRange) setSelectedBudget(parsed.budgetRange);
        if (parsed.timeline) setSelectedTimeline(parsed.timeline);
        if (parsed.populationServed) setPopulationServed(parsed.populationServed);
        if (parsed.coverageArea) setCoverageArea(parsed.coverageArea);
        if (parsed.numberOfStaff) setNumberOfStaff(parsed.numberOfStaff);
        if (parsed.currentEquipment) setCurrentEquipment(parsed.currentEquipment);
      }
    } catch {}
  }, [reset]);

  const onSubmit = (data: OnboardingStep4FormValues) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "rdg_onboarding_step4",
        JSON.stringify({
          requestDescription: data.requestDescription,
          budgetRange: selectedBudget,
          timeline: selectedTimeline,
          populationServed,
          coverageArea,
          numberOfStaff,
          currentEquipment,
        })
      );
    }
    router.push("/onboarding/step5");
  };

  const cardClass = (id: string, selected: string) =>
    `flex flex-col gap-0.5 p-3 rounded-lg border cursor-pointer transition-all ${
      selected === id
        ? "border-[#ef3e34] bg-[#fff4f4]"
        : "border-[#e5e7eb] bg-white hover:border-[#ef3e34]/40"
    }`;

  const timelineClass = (id: string) =>
    `flex-1 py-2.5 px-4 rounded-lg border cursor-pointer transition-all text-left ${
      selectedTimeline === id
        ? "border-[#ef3e34] bg-[#fff4f4]"
        : "border-[#e5e7eb] bg-white hover:border-[#ef3e34]/40"
    }`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-4 pb-12 pt-6 sm:pt-8">
      <OnboardingLogo />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-[520px] flex-col gap-6 rounded-2xl border border-[#f0f0f0] bg-white px-4 py-6 shadow-[0_4px_32px_rgba(0,0,0,0.10)] sm:px-8 sm:py-8"
        noValidate
      >
        <div className="flex flex-col gap-1">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl tracking-[0.5px] uppercase">Primary Funding Need</h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm leading-5">
            What is this grant request primarily for? This is how grants are written and searched.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Describe Your Specific Request <span className="text-[#ef3e34]">*</span>
          </p>
          <Textarea
            placeholder="Organization's core mission.."
            rows={4}
            className={cn(
              "border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34] resize-none",
              errors.requestDescription && "border-red-500 focus-visible:ring-red-500"
            )}
            {...register("requestDescription")}
          />
          {errors.requestDescription && (
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.requestDescription.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Budget Range <span className="text-[#ef3e34]">*</span>
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {budgets.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedBudget(item.id)} className={cardClass(item.id, selectedBudget)}>
                <span className={`[font-family:'Montserrat',Helvetica] font-semibold text-sm text-left ${selectedBudget === item.id ? "text-[#ef3e34]" : "text-[#111827]"}`}>
                  {item.title}
                </span>
                <span className="[font-family:'Montserrat',Helvetica] font-normal text-xs text-left text-[#9ca3af]">
                  {item.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">Timeline</p>
          <div className="flex gap-2.5">
            {timelines.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedTimeline(item.id)} className={timelineClass(item.id)}>
                <span className={`[font-family:'Montserrat',Helvetica] font-semibold text-sm ${selectedTimeline === item.id ? "text-[#ef3e34]" : "text-[#111827]"}`}>
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="[font-family:'Montserrat',Helvetica] font-semibold text-sm text-[#111827]">Tell us about your agency</p>
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">Optional — helps us find better-matched funders</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="[font-family:'Montserrat',Helvetica] font-medium text-xs text-[#374151]">Population Served</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 50000"
                value={populationServed}
                onChange={(e) => setPopulationServed(e.target.value)}
                className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] focus:border-[#ef3e34] focus:outline-none focus:ring-1 focus:ring-[#ef3e34]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="[font-family:'Montserrat',Helvetica] font-medium text-xs text-[#374151]">Coverage Area</label>
              <input
                type="text"
                placeholder="e.g. 250 square miles"
                value={coverageArea}
                onChange={(e) => setCoverageArea(e.target.value)}
                className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] focus:border-[#ef3e34] focus:outline-none focus:ring-1 focus:ring-[#ef3e34]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="[font-family:'Montserrat',Helvetica] font-medium text-xs text-[#374151]">Number of Staff</label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 120"
                value={numberOfStaff}
                onChange={(e) => setNumberOfStaff(e.target.value)}
                className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] focus:border-[#ef3e34] focus:outline-none focus:ring-1 focus:ring-[#ef3e34]/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="[font-family:'Montserrat',Helvetica] font-medium text-xs text-[#374151]">Current Equipment</label>
            <Textarea
              placeholder="Describe your current radio/comms equipment"
              rows={3}
              value={currentEquipment}
              onChange={(e) => setCurrentEquipment(e.target.value)}
              className="border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34] resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => router.push("/onboarding/step3")} className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#6b7280] hover:text-[#374151] transition-colors">
            Back
          </button>
          <button type="submit" className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#ef3e34] px-6 text-white transition-colors hover:bg-[#d63530] sm:w-auto">
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-sm">Continue</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
};
