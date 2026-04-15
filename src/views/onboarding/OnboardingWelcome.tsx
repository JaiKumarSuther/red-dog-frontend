"use client";

import { useRouter } from "next/navigation";
import { Target, FileText, CheckCircle, ChevronRight } from "lucide-react";
import { RedDogLogo } from "@/components/RedDogLogo";

const features = [
  { icon: Target, label: "Smart matching" },
  { icon: FileText, label: "AI writing" },
  { icon: CheckCircle, label: "Win tracking" },
];

export const OnboardingWelcome = () => {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-4 pb-12 pt-6 sm:pt-8">
      <div className="mb-8 self-start">
        <RedDogLogo />
      </div>

      {/* Card */}
      <div className="flex w-full max-w-[520px] flex-col items-center gap-6 rounded-2xl border border-[#f0f0f0] bg-white px-5 py-8 shadow-[0_4px_32px_rgba(0,0,0,0.10)] sm:px-10 sm:py-9">
        {/* Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl tracking-[0.5px] uppercase">
            Welcome To Grant Intelligence
          </h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm leading-5 max-w-[360px]">
            The AI-powered platform that finds, matches, and helps you win
            grants – built for Agencies and Organizations seeking funding.
          </p>
        </div>

        {/* Meet Ashleen box */}
        <div className="w-full bg-[#fff4f4] rounded-xl p-4 flex gap-3 items-start">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#ef3e34] flex items-center justify-center flex-shrink-0">
            <span className="[font-family:'Montserrat',Helvetica] font-bold text-white text-sm">
              A
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div>
              <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm leading-tight">
                Meet Ashleen
              </p>
              <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#ef3e34] text-xs">
                Your AI Grant Writing Expert
              </p>
            </div>
            <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#374151] text-xs leading-5">
              &apos;Hi! I&apos;m Ashleen – I&apos;ll analyze thousands of grants, score them
              for your org, and help you write winning applications. Let&apos;s get
              set up so I can start finding you funding!&apos;
            </p>
          </div>
        </div>

        {/* Feature icons row */}
        <div className="flex w-full flex-wrap items-start justify-center gap-6 sm:gap-10">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#fff1f0] flex items-center justify-center">
                <Icon size={18} className="text-[#ef3e34]" />
              </div>
              <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-xs">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Get Started button */}
        <button
          onClick={() => router.push("/onboarding/step1")}
          data-testid="button-get-started"
          className="w-full h-11 bg-[#ef3e34] hover:bg-[#d63530] active:bg-[#c02c28] text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <span className="[font-family:'Montserrat',Helvetica] font-semibold text-sm">
            Get Started
          </span>
          <ChevronRight size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
};
