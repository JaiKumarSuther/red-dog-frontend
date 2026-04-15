"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { RedDogLogo } from "@/components/RedDogLogo";

const OnboardingLogo = () => (
  <div className="mb-8 self-start">
    <RedDogLogo />
  </div>
);

const programAreas = [
  { id: "comms", title: "Communications & Interoperability", sub: "Radios, dispatch, towers, FirstNet" },
  { id: "vehicles", title: "Vehicles & Fleet Equipment", sub: "Patrol, fire apparatus, ambulances" },
  { id: "tech", title: "Technology & IT Systems", sub: "CAD, RMS, MDTs, AI platforms" },
  { id: "facilities", title: "Facilities & Infrastructure", sub: "Station build/renovation, EOC" },
  { id: "ppe", title: "PPE & Personnel Safety", sub: "Turnout gear, body armor, SCBA" },
  { id: "medical", title: "Medical Equipment & EMS Supplies", sub: "Defibrillators, trauma kits" },
  { id: "broadband", title: "Public Safety Broadband", sub: "FirstNet, LTE, mesh networks" },
  { id: "community", title: "Community Programs & Outreach", sub: "Violence prevention, mental health" },
  { id: "training", title: "Training & Personnel Development", sub: "Certifications, VR/AR, exercises" },
  { id: "cybersecurity", title: "Cybersecurity & Data Protection", sub: "Network security, encryption" },
];

export const OnboardingStep3 = () => {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(["comms"]);
  const [otherText, setOtherText] = useState("");

  const PREDEFINED_AREAS = programAreas.map((x) => x.id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("rdg_onboarding_step3");
      if (saved) {
        const parsed = JSON.parse(saved) as { programAreas?: string[] };
        if (Array.isArray(parsed.programAreas) && parsed.programAreas.length > 0) {
          const custom = parsed.programAreas.find((t) => !PREDEFINED_AREAS.includes(t));
          setSelected(parsed.programAreas.map((t) => (!PREDEFINED_AREAS.includes(t) ? "other" : t)));
          if (custom) setOtherText(custom);
        }
      }
    } catch {}
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const cardClass = (id: string) =>
    `flex flex-col gap-0.5 p-3 rounded-lg border cursor-pointer transition-all ${
      selected.includes(id)
        ? "border-[#ef3e34] bg-[#fff4f4]"
        : "border-[#e5e7eb] bg-white hover:border-[#ef3e34]/40"
    }`;

  const handleContinue = () => {
    if (selected.length === 0) return;
    if (typeof window !== "undefined") {
      const finalAreas = selected
        .filter((x) => x !== "other")
        .concat(selected.includes("other") && otherText.trim() ? [otherText.trim()] : []);
      sessionStorage.setItem("rdg_onboarding_step3", JSON.stringify({ programAreas: finalAreas }));
    }
    router.push("/onboarding/step4");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-4 pb-12 pt-6 sm:pt-8">
      <OnboardingLogo />
      <div className="flex w-full max-w-[520px] flex-col gap-6 rounded-2xl border border-[#f0f0f0] bg-white px-4 py-6 shadow-[0_4px_32px_rgba(0,0,0,0.10)] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl tracking-[0.5px] uppercase">Request Details</h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm leading-5">
            Select all areas you need funding for. You can choose more than one.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Program Areas <span className="text-[#ef3e34]">*</span>
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {programAreas.map((item) => (
              <button key={item.id} onClick={() => toggle(item.id)} className={cardClass(item.id)}>
                <span className={`[font-family:'Montserrat',Helvetica] font-semibold text-sm text-left ${selected.includes(item.id) ? "text-[#ef3e34]" : "text-[#111827]"}`}>
                  {item.title}
                </span>
                <span className="[font-family:'Montserrat',Helvetica] font-normal text-xs text-left text-[#9ca3af]">
                  {item.sub}
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => toggle("other")} className={cardClass("other")}>
            <span className={`[font-family:'Montserrat',Helvetica] font-semibold text-sm text-left ${selected.includes("other") ? "text-[#ef3e34]" : "text-[#111827]"}`}>
              Other
            </span>
          </button>
          {selected.includes("other") && (
            <div className="mt-3">
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Describe your program area..."
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          )}
          {selected.length === 0 && (
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">Please select at least one program area.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => router.push("/onboarding/step2")} className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#6b7280] hover:text-[#374151] transition-colors">
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={selected.length === 0}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#ef3e34] px-6 text-white transition-colors hover:bg-[#d63530] sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-sm">Continue</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
