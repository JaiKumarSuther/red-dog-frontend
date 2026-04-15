"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";

interface Win {
  _id: string;
  agencyType: string;
  fundingType?: string;
  projectType?: string;
  funderName?: string;
  awardAmount?: number;
  problemStatement?: string;
  communityImpact?: string;
  proposedSolution?: string;
  measurableOutcomes?: string;
  winFactors?: string[];
  lessonsLearned?: string;
  createdAt: string;
  applicationId?: { projectTitle?: string; status?: string };
}

interface WinInsights {
  totalWins: number;
  totalAwarded: number;
  winsByAgencyType: Record<string, number>;
  winsByFundingType: Record<string, number>;
  topFunders: { name: string; winCount: number }[];
  commonWinFactors: { factor: string; count: number }[];
}

interface WinPatterns {
  totalSampled: number;
  topFunders: { name: string; count: number }[];
  topAgencyTypes: { agencyType: string; count: number }[];
  correlatedSections: { factor: string; count: number }[];
}

const fmt = (n?: number) => (n != null ? "$" + n.toLocaleString() : "—");

export const Wins = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data: insights,
    isLoading: insightsLoading,
    isError: insightsError,
    refetch: refetchInsights,
  } = useQuery<WinInsights>({
    queryKey: qk.winInsights(),
    queryFn: async () => {
      const res = await api.get("/wins/insights");
      return res.data.data;
    },
  });

  const {
    data: patterns,
    isError: patternsError,
    refetch: refetchPatterns,
  } = useQuery<WinPatterns>({
    queryKey: qk.winPatterns(),
    queryFn: async () => {
      const res = await api.get("/wins/patterns");
      return res.data.data;
    },
  });

  const { data: appMeta } = useQuery({
    queryKey: ["applications", "total-for-winrate"],
    queryFn: async () => {
      const res = await api.get("/applications", { params: { limit: 1 } });
      return res.data.pagination as { total?: number };
    },
  });

  const {
    data,
    isLoading: winsLoading,
    isError: winsError,
    refetch: refetchWins,
  } = useQuery<{ data: Win[] }>({
    queryKey: qk.wins(),
    queryFn: async () => {
      const res = await api.get("/wins", { params: { limit: 50 } });
      return res.data;
    },
  });

  const wins: Win[] = data?.data ?? [];
  const totalApps = appMeta?.total ?? 0;
  const winRatePct =
    insights && totalApps > 0 ? Math.min(100, Math.round((insights.totalWins / totalApps) * 100)) : null;

  if (insightsError || winsError || patternsError) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-3 bg-neutral-50 py-20">
        <p className="[font-family:'Montserrat',Helvetica] text-base text-red-600">
          Failed to load win database. Please try again.
        </p>
        <button
          type="button"
          onClick={() => {
            void refetchInsights();
            void refetchWins();
            void refetchPatterns();
          }}
          className="rounded-lg bg-[#ef3e34] px-4 py-2 [font-family:'Montserrat',Helvetica] text-sm font-semibold text-white hover:bg-[#d63029]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
      <div>
        <h1 className="[font-family:'Oswald',Helvetica] text-2xl font-bold uppercase leading-tight tracking-[0.5px] text-black sm:text-3xl">
          Win Database
        </h1>
        <p className="mt-1 [font-family:'Montserrat',Helvetica] text-sm font-normal text-[#6b7280]">
          Successful grant applications stored for AI learning and reference
        </p>
      </div>

      {insightsLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-[#e5e7eb] bg-white" />
          ))}
        </div>
      ) : insights ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-xl border border-[#e5e7eb] bg-white p-4">
            <p className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#6b7280]">Total Won</p>
            <p className="[font-family:'Oswald',Helvetica] text-2xl font-bold text-[#22c55e]">{insights.totalWins}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-[#e5e7eb] bg-white p-4">
            <p className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#6b7280]">Total $ Awarded</p>
            <p className="[font-family:'Oswald',Helvetica] text-2xl font-bold text-[#50a2ff]">
              {insights.totalAwarded >= 1000000
                ? "$" + (insights.totalAwarded / 1000000).toFixed(1) + "M"
                : fmt(insights.totalAwarded)}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-[#e5e7eb] bg-white p-4">
            <p className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#6b7280]">Win rate</p>
            <p className="[font-family:'Oswald',Helvetica] text-2xl font-bold text-[#111827]">
              {winRatePct != null ? `${winRatePct}%` : "—"}
            </p>
            <p className="[font-family:'Montserrat',Helvetica] text-[10px] text-[#9ca3af]">
              Wins ÷ applications submitted (org)
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-[#e5e7eb] bg-white p-4">
            <p className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#6b7280]">Top Funder</p>
            <p className="[font-family:'Oswald',Helvetica] text-lg font-bold leading-tight text-[#111827]">
              {insights.topFunders[0]?.name || "—"}
            </p>
          </div>
        </div>
      ) : null}

      {patterns && (patterns.correlatedSections?.length > 0 || patterns.topAgencyTypes?.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {patterns.topAgencyTypes?.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="[font-family:'Montserrat',Helvetica] text-sm font-bold uppercase tracking-wide text-[#111827]">
                Agency types that win most
              </h2>
              {patterns.topAgencyTypes.slice(0, 6).map((row) => (
                <div key={row.agencyType} className="flex items-center justify-between">
                  <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{row.agencyType}</span>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-green-700">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          )}
          {patterns.correlatedSections?.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="[font-family:'Montserrat',Helvetica] text-sm font-bold uppercase tracking-wide text-[#111827]">
                Application themes tied to wins
              </h2>
              <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">
                Derived from win-factor tags across {patterns.totalSampled} recent wins (AI learning corpus).
              </p>
              {patterns.correlatedSections.slice(0, 8).map((row) => (
                <div key={row.factor} className="flex items-center justify-between">
                  <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{row.factor}</span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-blue-700">
                    {row.count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {insights && (insights.commonWinFactors?.length > 0 || insights.topFunders?.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.topFunders?.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="[font-family:'Montserrat',Helvetica] text-sm font-bold uppercase tracking-wide text-[#111827]">
                Top funders (your org)
              </h2>
              {insights.topFunders.map((f) => (
                <div key={f.name} className="flex items-center justify-between">
                  <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{f.name}</span>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-green-700">
                    {f.winCount} win{f.winCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          {insights.commonWinFactors?.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-5">
              <h2 className="[font-family:'Montserrat',Helvetica] text-sm font-bold uppercase tracking-wide text-[#111827]">
                Common win factors
              </h2>
              {insights.commonWinFactors.slice(0, 6).map((f) => (
                <div key={f.factor} className="flex items-center justify-between">
                  <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{f.factor}</span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-blue-700">
                    {f.count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#e5e7eb] px-5 py-4">
          <h2 className="[font-family:'Montserrat',Helvetica] text-sm font-bold uppercase tracking-wide text-[#111827]">
            Winning applications ({wins.length})
          </h2>
        </div>

        {winsLoading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse border-b border-[#e5e7eb] bg-gray-50" />
            ))}
          </div>
        ) : wins.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">
              No wins recorded yet. Applications marked as &quot;Awarded&quot; will appear here.
            </p>
          </div>
        ) : (
          wins.map((w) => {
            const open = expandedId === w._id;
            return (
              <div key={w._id} className="flex flex-col gap-3 border-b border-[#e5e7eb] px-5 py-4 last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setExpandedId(open ? null : w._id)}
                >
                  <div>
                    <p className="[font-family:'Montserrat',Helvetica] text-sm font-bold text-[#111827]">
                      {w.funderName || "Unknown funder"}
                    </p>
                    {w.applicationId?.projectTitle && (
                      <p className="mt-0.5 [font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                        {w.applicationId.projectTitle}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-green-700">
                        {w.agencyType}
                      </span>
                      {w.fundingType && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 [font-family:'Montserrat',Helvetica] text-xs text-blue-700">
                          {w.fundingType}
                        </span>
                      )}
                      {w.projectType && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 [font-family:'Montserrat',Helvetica] text-xs text-purple-700">
                          {w.projectType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="[font-family:'Montserrat',Helvetica] text-base font-bold text-[#22c55e]">
                      {fmt(w.awardAmount)}
                    </p>
                    <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">
                      {new Date(w.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {open ? <ChevronUp size={18} className="text-[#9ca3af]" /> : <ChevronDown size={18} className="text-[#9ca3af]" />}
                  </div>
                </button>

                {!open && w.problemStatement && (
                  <p className="[font-family:'Montserrat',Helvetica] line-clamp-2 text-xs text-[#6b7280]">
                    {w.problemStatement}
                  </p>
                )}

                {open && (
                  <div className="flex flex-col gap-3 rounded-lg border border-[#f0f0f0] bg-[#fafafa] p-4">
                    {w.winFactors && w.winFactors.length > 0 && (
                      <div>
                        <p className="mb-1 [font-family:'Montserrat',Helvetica] text-xs font-bold uppercase tracking-wide text-[#111827]">
                          What made this win
                        </p>
                        <ul className="list-disc space-y-1 pl-4 [font-family:'Montserrat',Helvetica] text-sm text-[#374151]">
                          {w.winFactors.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {w.problemStatement && (
                      <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                        <span className="font-semibold text-[#111827]">Problem: </span>
                        {w.problemStatement}
                      </p>
                    )}
                    {w.communityImpact && (
                      <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                        <span className="font-semibold text-[#111827]">Impact: </span>
                        {w.communityImpact}
                      </p>
                    )}
                    {w.proposedSolution && (
                      <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                        <span className="font-semibold text-[#111827]">Solution: </span>
                        {w.proposedSolution}
                      </p>
                    )}
                    {w.measurableOutcomes && (
                      <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                        <span className="font-semibold text-[#111827]">Outcomes: </span>
                        {w.measurableOutcomes}
                      </p>
                    )}
                    {w.lessonsLearned && (
                      <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                        <span className="font-semibold text-[#111827]">Lessons: </span>
                        {w.lessonsLearned}
                      </p>
                    )}
                  </div>
                )}

                {!open && w.winFactors && w.winFactors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {w.winFactors.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-[#f3f4f6] px-2 py-0.5 [font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
