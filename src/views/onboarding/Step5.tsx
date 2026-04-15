"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, FileText, Sparkles, ClipboardList, Check } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { RedDogLogo } from "@/components/RedDogLogo";

const OnboardingLogo = () => (
  <div className="mb-8 self-start">
    <RedDogLogo />
  </div>
);

const goalItems = [
  { id: "discover", icon: Search, label: "Discover new grant opportunities" },
  { id: "track", icon: FileText, label: "Track application progress" },
  { id: "ai-write", icon: Sparkles, label: "Use AI to write grant proposals" },
  { id: "ai-score", icon: ClipboardList, label: "Get AI-powered grant-fit scoring" },
];

const getStoredStep = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};

export const OnboardingStep5 = () => {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set(["discover"]));
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allIds = goalItems.map((g) => g.id);
  const allSelected = allIds.every((id) => selected.has(id));

  const toggle = (id: string) => {
    setGoalsError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setGoalsError(null);
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const continueToDashboard = async () => {
    if (selected.size === 0) {
      setGoalsError("Select at least one goal to continue.");
      return;
    }
    setGoalsError(null);
    setLoading(true);

    const step1 = getStoredStep<{
      organizationName: string;
      location: string;
      websiteUrl: string;
      missionStatement: string;
    }>("rdg_onboarding_step1");
    const step2 = getStoredStep<{ agencyTypes: string[] }>("rdg_onboarding_step2");
    const step3 = getStoredStep<{ programAreas: string[] }>("rdg_onboarding_step3");
    const step4 = getStoredStep<{
      requestDescription: string;
      budgetRange: string;
      timeline: string;
      populationServed?: string;
      coverageArea?: string;
      numberOfStaff?: string;
      currentEquipment?: string;
    }>("rdg_onboarding_step4");

    const payload = {
      organizationName: step1?.organizationName ?? "",
      location: step1?.location ?? "",
      websiteUrl: step1?.websiteUrl ?? "",
      missionStatement: step1?.missionStatement ?? "",
      agencyTypes: Array.isArray(step2?.agencyTypes) ? step2.agencyTypes : [],
      programAreas: Array.isArray(step3?.programAreas) ? step3.programAreas : [],
      // Note: Step4 stores the value as `requestDescription`; the backend expects `specificRequest`
      specificRequest: step4?.requestDescription ?? "",
      budgetRange: step4?.budgetRange ?? "under-25k",
      timeline: step4?.timeline ?? "planned",
      goals: Array.from(selected),
      populationServed: step4?.populationServed ? Number(step4.populationServed) : undefined,
      coverageArea: step4?.coverageArea || undefined,
      numberOfStaff: step4?.numberOfStaff ? Number(step4.numberOfStaff) : undefined,
      currentEquipment: step4?.currentEquipment || undefined,
    };

    try {
      const res = await api.post("/onboarding/complete", payload);
      const { user } = res.data.data;

      const updatedUser = { ...user, onboardingCompleted: true };
      updateUser(updatedUser);

      sessionStorage.removeItem("rdg_onboarding_step1");
      sessionStorage.removeItem("rdg_onboarding_step2");
      sessionStorage.removeItem("rdg_onboarding_step3");
      sessionStorage.removeItem("rdg_onboarding_step4");

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to complete onboarding. Please try again.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const rowClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
      active
        ? "border-[#ef3e34] bg-[#fff4f4]"
        : "border-[#e5e7eb] bg-white hover:border-[#ef3e34]/40"
    }`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-4 pb-12 pt-6 sm:pt-8">
      <OnboardingLogo />
      <div className="flex w-full max-w-[520px] flex-col gap-6 rounded-2xl border border-[#f0f0f0] bg-white px-4 py-6 shadow-[0_4px_32px_rgba(0,0,0,0.10)] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl tracking-[0.5px] uppercase">Your Goals</h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm leading-5">
            What do you want to accomplish? Ashleen will tailor her approach accordingly.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {goalItems.map(({ id, icon: Icon, label }) => {
            const active = selected.has(id);
            return (
              <button key={id} type="button" onClick={() => toggle(id)} className={rowClass(active)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${active ? "bg-[#ef3e34]" : "bg-[#f3f4f6]"}`}>
                  <Icon size={15} className={active ? "text-white" : "text-[#9ca3af]"} />
                </div>
                <span className={`[font-family:'Montserrat',Helvetica] font-semibold text-sm ${active ? "text-[#ef3e34]" : "text-[#111827]"}`}>
                  {label}
                </span>
              </button>
            );
          })}

          <button type="button" onClick={toggleAll} className={rowClass(allSelected)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${allSelected ? "bg-[#ef3e34]" : "bg-[#f3f4f6]"}`}>
              <Check size={15} className={allSelected ? "text-white" : "text-[#9ca3af]"} />
            </div>
            <span className={`[font-family:'Montserrat',Helvetica] font-semibold text-sm ${allSelected ? "text-[#ef3e34]" : "text-[#111827]"}`}>
              Choose All
            </span>
          </button>
        </div>

        {goalsError && (
          <p className="[font-family:'Montserrat',Helvetica] text-sm text-red-600">{goalsError}</p>
        )}
        {apiError && (
          <p className="[font-family:'Montserrat',Helvetica] text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
        )}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => router.push("/onboarding/step4")} className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#6b7280] hover:text-[#374151] transition-colors">
            Back
          </button>
          <button type="button" onClick={continueToDashboard} disabled={loading} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#ef3e34] px-6 text-white transition-colors hover:bg-[#d63530] sm:w-auto disabled:opacity-60">
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-sm">{loading ? "Saving..." : "Continue"}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
