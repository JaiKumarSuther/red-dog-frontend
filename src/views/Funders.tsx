"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Lock, Eye } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface Funder {
  _id: string;
  name: string;
  missionStatement?: string;
  locationFocus?: string[];
  fundingCategories?: string[];
  agencyTypesFunded?: string[];
  avgGrantMin?: number;
  avgGrantMax?: number;
  deadline?: string;
  cyclesPerYear?: number;
  contactName?: string;
  contactEmail?: string;
  website?: string;
  notes?: string;
  isLocked?: boolean;
  currentApplicationCount?: number;
  maxApplicationsAllowed?: number;
  status: string;
  matchScore?: number | null;
  matchTier?: "high" | "medium" | "low" | null;
  matchReasons?: string[];
}

const fmt = (n?: number) => (n != null ? "$" + n.toLocaleString() : "—");

const daysUntil = (d?: string) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

const MatchScoreBadge = ({ score, tier }: { score: number; tier?: string | null }) => {
  const colorCls =
    tier === "high"
      ? "bg-green-100 text-green-700 border-green-200"
      : tier === "medium"
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : "bg-red-100 text-red-600 border-red-200";

  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold [font-family:'Montserrat',Helvetica] tabular-nums",
        colorCls
      )}
      title={`Match score: ${score}/100`}
    >
      {score}% match
    </span>
  );
};

export const Funders = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<{ data: Funder[] }>({
    queryKey: qk.funders(),
    queryFn: async () => {
      const res = await api.get("/funders", { params: { limit: 100 } });
      return res.data;
    },
  });

  const allFunders: Funder[] = data?.data ?? [];
  const hasScores = allFunders.some((f) => f.matchScore != null);

  const funders: Funder[] = allFunders.filter((f) => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.missionStatement?.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      !categoryFilter ||
      f.fundingCategories?.some((c) => c.toLowerCase().includes(categoryFilter.toLowerCase()));
    const matchTier = !tierFilter || f.matchTier === tierFilter;
    const matchOpen = !openOnly || !f.isLocked;
    return matchSearch && matchCat && matchTier && matchOpen;
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl sm:text-3xl tracking-[0.5px] uppercase leading-tight">
            Funder Database
          </h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm">
            Private library of grant funders curated for public safety agencies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
            {funders.length} funder{funders.length !== 1 ? "s" : ""}
          </span>
          {hasScores && (
            <span className="rounded-full bg-green-50 border border-green-200 px-3 py-0.5 text-xs font-semibold text-green-700 [font-family:'Montserrat',Helvetica]">
              ✦ Scored for your agency
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="flex-1 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
          placeholder="Search funders by name or mission..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="w-full sm:w-52 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#ef3e34] focus:outline-none"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
        {hasScores && (
          <select
            className="w-full sm:w-44 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="">All Match Tiers</option>
            <option value="high">High Match (≥75%)</option>
            <option value="medium">Medium Match (50–74%)</option>
            <option value="low">Low Match (&lt;50%)</option>
          </select>
        )}
        <div className="flex items-center gap-2 sm:ml-2">
          <Switch id="open-funders" checked={openOnly} onCheckedChange={setOpenOnly} />
          <Label htmlFor="open-funders" className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151] cursor-pointer">
            Open funders only
          </Label>
        </div>
      </div>

      {/* Legend */}
      {hasScores && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] font-semibold uppercase tracking-wide">Match:</span>
          <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700 [font-family:'Montserrat',Helvetica]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> High ≥75%
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-semibold text-orange-700 [font-family:'Montserrat',Helvetica]">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" /> Medium 50–74%
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-600 [font-family:'Montserrat',Helvetica]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Low &lt;50%
          </span>
        </div>
      )}

      {isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="[font-family:'Montserrat',Helvetica] text-red-600 text-base">Failed to load funders. Please try again.</p>
          <button onClick={() => refetch()} className="rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d63029]">
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-white animate-pulse border border-[#e5e7eb]" />
          ))}
        </div>
      ) : funders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="[font-family:'Montserrat',Helvetica] text-[#6b7280] text-base">No funders found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {funders.map((f) => {
            const days = daysUntil(f.deadline);
            const urgent = days != null && days <= 14 && days >= 0;
            const hasScore = f.matchScore != null;

            return (
              <div
                key={f._id}
                className={cn(
                  "flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                  hasScore && f.matchTier === "high"
                    ? "border-green-200 hover:border-green-300"
                    : hasScore && f.matchTier === "medium"
                    ? "border-orange-200 hover:border-orange-300"
                    : "border-[#e5e7eb] hover:border-[#ef3e3433]"
                )}
                onClick={() => router.push(`/funders/${f._id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-base leading-snug min-w-0 flex-1">
                    {f.name}
                  </h3>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {hasScore && f.matchScore != null && (
                      <MatchScoreBadge score={f.matchScore} tier={f.matchTier} />
                    )}
                    {f.isLocked && (
                      <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 [font-family:'Montserrat',Helvetica]">
                        <Lock size={11} className="shrink-0" /> LOCKED
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs [font-family:'Montserrat',Helvetica] text-[#6b7280]">
                    <span>Application spots</span>
                    <span className="font-semibold text-[#111827]">
                      {f.currentApplicationCount ?? 0} / {f.maxApplicationsAllowed ?? 5} filled
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      ((f.currentApplicationCount ?? 0) / Math.max(1, f.maxApplicationsAllowed ?? 5)) * 100
                    )}
                    className="h-2 bg-[#f3f4f6]"
                  />
                </div>

                <p className="[font-family:'Montserrat',Helvetica] text-[#6b7280] text-sm leading-relaxed line-clamp-2">
                  {f.missionStatement || "No mission statement available."}
                </p>

                {/* Match reasons (top 1) */}
                {hasScore && f.matchReasons && f.matchReasons.length > 0 && (
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280] italic line-clamp-1">
                    ✦ {f.matchReasons[0]}
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">
                      Grant Range
                    </span>
                    <span className="[font-family:'Montserrat',Helvetica] text-sm font-bold text-[#111827]">
                      {fmt(f.avgGrantMin)} – {fmt(f.avgGrantMax)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">
                      Location
                    </span>
                    <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">
                      {f.locationFocus?.join(", ") || "—"}
                    </span>
                  </div>
                  {f.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">
                        Deadline
                      </span>
                      <span className={`[font-family:'Montserrat',Helvetica] text-sm font-semibold ${urgent ? "text-red-600" : "text-[#374151]"}`}>
                        {new Date(f.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {urgent && ` (${days}d left)`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {f.fundingCategories?.slice(0, 3).map((c) => (
                    <span key={c} className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs [font-family:'Montserrat',Helvetica] text-[#6b7280]">
                      {c}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-semibold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/funders/${f._id}`);
                  }}
                >
                  <Eye size={14} className="shrink-0" />
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
