"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw, X, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileFilterSelect } from "@/components/MobileFilterSelect";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useAuth } from "@/lib/AuthContext";

type Match = {
  id: string;
  score: number;
  org: string;
  opportunity: string;
  status: string;
  lastActivity: string;
  grant: string;
  funder: string;
  amount: string;
  deadline: string;
  fitScore: string;
  aiReasoning: string;
};

type ApiMatch = {
  _id: string;
  fitScore?: number;
  state?: string;
  status?: string;
  organization?: { name?: string };
  opportunity?: {
    title?: string;
    funder?: string;
    minAmount?: number;
    maxAmount?: number;
    deadline?: string;
  };
  updatedAt?: string;
  notes?: string;
  aiReasoning?: string;
  reasons?: string[];
  fitReasons?: string[];
};

const formatAmountRange = (min?: number, max?: number): string | null => {
  const fmt = (n: number) => "$" + n.toLocaleString();
  if (min != null && max != null && min > 0 && max > 0) return `${fmt(min)} – ${fmt(max)}`;
  if (max != null && max > 0) return `Up to ${fmt(max)}`;
  if (min != null && min > 0) return `From ${fmt(min)}`;
  return null;
};

const fmtDate = (s: string | undefined) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return s;
  }
};

const fmtActivity = (s: string | undefined) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return s;
  }
};

const reasoningFrom = (m: ApiMatch) => {
  const fromLists = [...(m.fitReasons || []), ...(m.reasons || [])].filter(Boolean);
  if (fromLists.length) return fromLists.join(" ");
  return m.notes ?? m.aiReasoning ?? "No analysis available yet.";
};

const mapMatch = (m: ApiMatch): Match => ({
  id: m._id,
  score: m.fitScore ?? 0,
  org: m.organization?.name ?? "Unknown",
  opportunity: m.opportunity?.title ?? "Unknown",
  status: m.state ?? m.status ?? "pending",
  lastActivity: fmtActivity(m.updatedAt),
  grant: m.opportunity?.title ?? "Unknown",
  funder: m.opportunity?.funder ?? "—",
  amount: formatAmountRange(m.opportunity?.minAmount, m.opportunity?.maxAmount) ?? "—",
  deadline: fmtDate(m.opportunity?.deadline),
  fitScore: `${m.fitScore ?? 0}%`,
  aiReasoning: reasoningFrom(m),
});

const scoreColor = (n: number) => {
  if (n >= 75) return { border: "border-[#22c55e]", text: "text-[#22c55e]", bg: "bg-[#f0fdf4]" };
  if (n >= 50) return { border: "border-[#f97316]", text: "text-[#f97316]", bg: "bg-[#fff7ed]" };
  return { border: "border-[#ef4444]", text: "text-[#ef4444]", bg: "bg-[#fff1f0]" };
};

const statusBadge = (s: string) => {
  if (s === "pending") return "bg-[#fef9c3] text-[#b45309]";
  if (s === "reviewed") return "bg-[#dbeafe] text-[#1d4ed8]";
  if (s === "applied") return "bg-[#dcfce7] text-[#16a34a]";
  if (s === "approved") return "bg-[#dcfce7] text-[#16a34a]";
  if (s === "rejected") return "bg-[#fee2e2] text-[#dc2626]";
  return "bg-[#f3f4f6] text-[#6b7280]";
};

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface MatchPreviewModalProps {
  match: Match;
  onClose: () => void;
}

const MatchPreviewModal = ({ match, onClose }: MatchPreviewModalProps) => {
  const sc = scoreColor(match.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] w-full max-w-[480px] mx-4 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-7 pt-7 pb-5">
          <h2 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl tracking-[0.5px] uppercase">Grant Details</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
            <X size={14} className="text-[#6b7280]" />
          </button>
        </div>

        <div className="px-7 pb-6 flex flex-col gap-5">
          <div className="bg-[#f9fafb] rounded-xl p-4 border border-[#f0f0f0]">
            <p className="[font-family:'Oswald',Helvetica] font-bold text-black text-base uppercase tracking-[0.3px]">{match.grant}</p>
            <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-xs mt-0.5">{match.funder} · {match.amount}</p>
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#ef3e34] text-xs mt-0.5 block">{match.org}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1 bg-[#f9fafb] rounded-xl p-4 border border-[#f0f0f0]">
              <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs">Fit Score</span>
              <span className={`[font-family:'Montserrat',Helvetica] font-bold text-base ${sc.text}`}>{match.fitScore}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-[#f9fafb] rounded-xl p-4 border border-[#f0f0f0]">
              <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs">Amount</span>
              <span className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-base">{match.amount}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-[#f9fafb] rounded-xl p-4 border border-[#f0f0f0]">
              <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs">Deadline</span>
              <span className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm">{match.deadline}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="[font-family:'Montserrat',Helvetica] font-semibold text-sm text-[#111827]">AI Reasoning</p>
            <div className="border border-[#f0f0f0] rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ef3e34] flex items-center justify-center flex-shrink-0">
                  <span className="[font-family:'Montserrat',Helvetica] font-bold text-white text-[10px]">A</span>
                </div>
                <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#ef3e34] text-sm">Ashleen&apos;s Analysis</span>
              </div>
              <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#374151] text-sm leading-5">{match.aiReasoning}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#f3f4f6] px-7 py-5">
          <p className="mb-3 [font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
            Approving or rejecting a match is done by Red Dog staff in the admin portal. You can still apply from{" "}
            <span className="font-semibold text-[#374151]">Opportunities</span> using Ashleen AI.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-lg bg-[#ef3e34] px-5 text-white [font-family:'Montserrat',Helvetica] text-sm font-semibold transition-colors hover:bg-[#d63530] sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const agencyFilterTabs = ["all", "high", "medium", "saved"] as const;
const adminFilterTabs = ["all", "high", "medium", "saved", "approved", "rejected"] as const;
type FilterTab = (typeof adminFilterTabs)[number];

const filterLabel = (t: FilterTab) => {
  if (t === "all") return "All";
  if (t === "high") return "High fit (80+)";
  if (t === "medium") return "Medium (65–79)";
  if (t === "approved") return "Approved";
  if (t === "rejected") return "Rejected";
  return "Saved";
};

export const Matches = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const filterTabs = isAdmin ? adminFilterTabs : agencyFilterTabs;

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest">("newest");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [previewMatch, setPreviewMatch] = useState<Match | null>(null);

  const { data: matches = [], isLoading: loading, refetch } = useQuery<Match[]>({
    queryKey: qk.matches(),
    queryFn: async () => {
      const res = await api.get("/matches", { params: { limit: 100 } });
      const raw: ApiMatch[] = res.data.data ?? [];
      return raw.map(mapMatch);
    },
  });

  const filtered = matches.filter((m) => {
    const matchSearch =
      !search ||
      m.org.toLowerCase().includes(search.toLowerCase()) ||
      m.opportunity.toLowerCase().includes(search.toLowerCase()) ||
      m.funder.toLowerCase().includes(search.toLowerCase());
    let matchBand = true;
    if (activeFilter === "high") matchBand = m.score >= 80;
    else if (activeFilter === "medium") matchBand = m.score >= 65 && m.score < 80;
    else if (activeFilter === "saved") matchBand = m.status === "approved";
    else if (activeFilter === "approved") matchBand = m.status === "approved";
    else if (activeFilter === "rejected") matchBand = m.status === "rejected";
    return matchSearch && matchBand;
  });

  const sorted = [...filtered].sort((a, b) =>
    sortBy === "highest" ? b.score - a.score : 0
  );

  return (
    <>
      <div className="flex min-h-full min-w-0 flex-col gap-4 bg-neutral-50 p-4 sm:gap-5 sm:p-6 lg:p-8">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex flex-col gap-1">
            <h1 className="[font-family:'Oswald',Helvetica] text-2xl font-bold uppercase leading-tight tracking-[0.5px] text-black sm:text-3xl break-words">
              Match Intelligence
            </h1>
            <p className="[font-family:'Montserrat',Helvetica] text-sm font-normal text-[#6b7280] max-w-prose break-words">
              AI-scored fit between organizations and grants
            </p>
          </div>
          <button
            type="button"
            aria-label="Force global refresh"
            onClick={() => void refetch()}
            className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#ef3e34] px-4 text-white transition-colors hover:bg-[#d63530] sm:w-auto"
          >
            <RefreshCw size={14} className={`shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold sm:hidden">Refresh</span>
            <span className="[font-family:'Montserrat',Helvetica] hidden text-sm font-semibold sm:inline">Force Global Refresh</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[#f0f0f0] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)] sm:px-5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by org, grant or funder..."
              data-testid="input-search-matches"
              className="pl-9 h-10 border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#9ca3af] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34]" />
          </div>
          <MobileFilterSelect
            ariaLabel="Sort matches"
            label="Sort by"
            value={sortBy}
            onChange={(v) => setSortBy(v as "newest" | "highest")}
            options={[
              { value: "newest", label: "Newest first" },
              { value: "highest", label: "Highest score" },
            ]}
            dataTestId="select-sort-matches"
          />
          <div className="hidden items-center gap-2 md:flex md:flex-wrap">
            <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#9ca3af] text-xs">Sort by:</span>
            {(["newest", "highest"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSortBy(s)}
                className={`h-6 px-3 rounded-full text-xs [font-family:'Montserrat',Helvetica] font-medium transition-all border ${
                  sortBy === s ? "bg-[#111827] text-white border-[#111827]" : "border-[#e5e7eb] text-[#6b7280] hover:border-[#9ca3af]"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2">
          <div className="min-w-0 flex-1 md:flex-initial">
            <MobileFilterSelect
              ariaLabel="Filter matches by status"
              label="Status"
              value={(filterTabs as readonly string[]).includes(activeFilter) ? activeFilter : "all"}
              onChange={(v) => setActiveFilter(v as FilterTab)}
              options={filterTabs.map((t) => ({
                value: t,
                label: filterLabel(t),
              }))}
              dataTestId="select-filter-matches"
            />
            <div className="hidden flex-wrap items-center gap-1.5 md:flex">
              {filterTabs.map((t) => (
                <button key={t} type="button" onClick={() => setActiveFilter(t)} data-testid={`tab-${t}`}
                  className={`h-8 px-4 rounded-lg [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-all capitalize ${
                    activeFilter === t ? "bg-[#ef3e34] text-white" : "bg-white border border-[#e5e7eb] text-[#6b7280] hover:border-[#ef3e34]/40"}`}>
                  {filterLabel(t)}
                </button>
              ))}
            </div>
          </div>
          <span className="[font-family:'Montserrat',Helvetica] text-sm font-normal text-[#9ca3af] md:flex-shrink-0 md:text-right">{sorted.length} results</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#f0f0f0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="border-b border-[#f3f4f6] px-4 py-3 sm:px-5">
            <span className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
              {loading ? "Loading..." : `${matches.length} Matches`}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">Loading matches...</span>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[#f3f4f6]">
                      {["Score", "Organization", "Opportunity", "Status", "Last Activity", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left lg:px-5">
                          <span className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                            {h}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((m, idx) => {
                      const sc = scoreColor(m.score);
                      return (
                        <tr
                          key={m.id}
                          data-testid={`row-match-${m.id}`}
                          className={`transition-colors hover:bg-[#fafafa] ${idx < sorted.length - 1 ? "border-b border-[#f9fafb]" : ""}`}
                        >
                          <td className="px-4 py-3 lg:px-5">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${sc.border} ${sc.bg}`}>
                              <span className={`[font-family:'Montserrat',Helvetica] text-sm font-bold ${sc.text}`}>{m.score}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 lg:px-5">
                            <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold break-words text-[#111827]">{m.org}</span>
                          </td>
                          <td className="px-4 py-3 lg:px-5">
                            <span className="[font-family:'Montserrat',Helvetica] text-sm font-normal break-words text-[#374151]">{m.opportunity}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold ${statusBadge(m.status)}`}>
                              {statusLabel(m.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                            <span className="[font-family:'Montserrat',Helvetica] text-sm font-normal text-[#9ca3af]">{m.lastActivity}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 lg:px-5">
                            <button
                              type="button"
                              onClick={() => setPreviewMatch(m)}
                              data-testid={`button-preview-match-${m.id}`}
                              className="flex items-center gap-1 [font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#ef3e34] hover:underline"
                            >
                              <Zap size={12} className="shrink-0" />
                              Preview
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="m-0 flex list-none flex-col gap-0 divide-y divide-[#f9fafb] p-0 md:hidden">
                {sorted.map((m) => {
                  const sc = scoreColor(m.score);
                  return (
                    <li key={m.id} data-testid={`row-match-${m.id}`} className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${sc.border} ${sc.bg}`}>
                            <span className={`[font-family:'Montserrat',Helvetica] text-sm font-bold ${sc.text}`}>{m.score}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="[font-family:'Montserrat',Helvetica] text-sm font-semibold break-words text-[#111827]">{m.org}</p>
                            <p className="mt-1 [font-family:'Montserrat',Helvetica] text-sm font-normal break-words text-[#374151]">{m.opportunity}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold ${statusBadge(m.status)}`}>
                            {statusLabel(m.status)}
                          </span>
                          <span className="[font-family:'Montserrat',Helvetica] text-xs font-normal text-[#9ca3af]">{m.lastActivity}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewMatch(m)}
                          data-testid={`button-preview-match-${m.id}`}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#ef3e34]/30 bg-[#fff4f4] py-2.5 [font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#ef3e34] transition-colors hover:bg-[#ffe8e8]"
                        >
                          <Zap size={14} className="shrink-0" />
                          Preview
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {previewMatch && <MatchPreviewModal match={previewMatch} onClose={() => setPreviewMatch(null)} />}
    </>
  );
};
