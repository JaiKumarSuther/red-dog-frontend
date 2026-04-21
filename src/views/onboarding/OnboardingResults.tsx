"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RedDogLogo } from "@/components/RedDogLogo";
import { ArrowRight, CheckCircle, Target, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface Match {
  fitScore: number;
  opportunityTitle: string;
  funderName: string;
  awardAmount: string | number;
}

export const OnboardingResults = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedResults = sessionStorage.getItem("rdg_onboarding_results");
      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        setData(parsed.data || parsed);
      }

      // Clear onboarding form data
      sessionStorage.removeItem("rdg_onboarding_step1");
      sessionStorage.removeItem("rdg_onboarding_step2");
      sessionStorage.removeItem("rdg_onboarding_step3");
      sessionStorage.removeItem("rdg_onboarding_step4");

      // ── CRITICAL: flip rdg_onboarding cookie to "1" ──────────────────────
      // The Next.js middleware blocks /dashboard and /matches while the
      // rdg_onboarding cookie is "0". updateUser writes onboardingCompleted
      // into both localStorage and the cookie so the guard passes immediately.
      if (user) {
        updateUser({ ...user, onboardingCompleted: true });
      } else {
        // Fallback: set cookie directly when user object isn't hydrated yet
        document.cookie = "rdg_onboarding=1; path=/; max-age=604800";
      }
    } catch {}
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  if (loading) return <div className="min-h-screen bg-white" />;

  const org = data?.organization || {};
  const matches: Match[] = data?.matches || [];
  const matchCount = data?.matchCount || matches.length || 0;

  const buildParagraph = () => {
    const orgName = org.name || "Your organization";
    const typeStr = (org.agencyTypes || []).map((t: string) => t.replace(/_/g, " ")).join(", ") || "organization";
    const pop = org.populationServed || "the community";
    const loc = org.location || "your area";

    let challengesStr = (org.challenges || []).join(", ");
    if (!challengesStr) challengesStr = "your specified needs";
    else challengesStr = challengesStr.replace(/_/g, " ");

    const topFit = matches.length > 0 ? matches[0].fitScore : null;
    const fitStr = topFit !== null ? ` Your top match has a fit score of ${topFit}%.` : "";

    return `${orgName} is a ${typeStr} serving approximately ${pop} in ${loc}. Based on your profile, you may qualify for funding to address ${challengesStr}.${fitStr}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-4 pb-12 pt-6 sm:pt-8">
      <div className="mb-8 self-start">
        <RedDogLogo />
      </div>

      <div className="flex w-full max-w-[800px] flex-col items-center gap-6 rounded-2xl border border-[#f0f0f0] bg-white px-5 py-8 shadow-[0_4px_32px_rgba(0,0,0,0.10)] sm:px-10 sm:py-9 animate-in fade-in zoom-in duration-500">
        
        <div className="flex flex-col items-center gap-4 text-center mb-2">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center ring-8 ring-green-50/50 mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-3xl sm:text-4xl tracking-[0.5px] uppercase">
            We found {matchCount} funding opportunities!
          </h1>
          <div className="max-w-[650px] bg-[#fff4f4] rounded-xl p-5 border border-red-100 relative mt-4 text-left">
            <Sparkles className="absolute top-0 right-0 w-32 h-32 text-red-500/5 -translate-y-4 translate-x-4 pointer-events-none" />
            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#111827] text-base leading-relaxed relative z-10">
              {buildParagraph()}
            </p>
          </div>
        </div>

        {matches.length > 0 ? (
          <div className="w-full flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="[font-family:'Oswald',Helvetica] font-semibold text-black text-xl tracking-tight uppercase">
                Your Top Matches
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.slice(0, 4).map((match, i) => (
                <div key={i} className="flex flex-col gap-3 p-5 rounded-xl border border-gray-200 bg-white hover:border-[#ef3e34] hover:shadow-md transition-all group cursor-pointer">
                  <div className="flex justify-between items-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ef3e34] px-2.5 py-1 text-xs font-bold text-white">
                      <Target className="w-3.5 h-3.5" />
                      {match.fitScore}% Match
                    </span>
                    {match.awardAmount && match.awardAmount !== 'TBD' && (
                      <span className="text-xs font-semibold text-[#374151] bg-gray-100 rounded-full px-2.5 py-1">
                        {typeof match.awardAmount === 'number'
                          ? `$${match.awardAmount.toLocaleString()}`
                          : match.awardAmount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-black text-lg leading-tight line-clamp-2 group-hover:text-[#ef3e34] transition-colors">
                      {match.opportunityTitle}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {match.funderName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full bg-gray-50 p-8 rounded-xl text-center border border-gray-200 mt-4">
            <p className="text-gray-600 font-medium">
              Your profile has been saved. Our team will review your information and surface matches shortly.
            </p>
          </div>
        )}

        <div className="w-full pt-8 mt-2 flex flex-col gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-5 [font-family:'Montserrat',Helvetica] text-base font-bold text-white transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 hover:shadow-lg"
          >
            Go to My Dashboard
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => router.push("/opportunities")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3.5 [font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#374151] transition-all hover:border-[#ef3e34] hover:text-[#ef3e34]"
          >
            View All Matches
          </button>
        </div>
      </div>
    </div>
  );
};
