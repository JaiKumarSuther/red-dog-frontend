"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, X, ExternalLink, Loader2, Calendar, DollarSign, Tag, ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Opportunity {
  _id: string;
  title: string;
  funder: string;
  deadline?: string;
  minAmount?: number;
  maxAmount?: number;
  sourceUrl?: string;
  keywords?: string[];
  agencyTypes?: string[];
  description?: string;
  category?: string;
  status: "open" | "closing" | "closed";
  createdAt?: string;
}

type RankedOpportunity = Opportunity & {
  fitScore: number | null;
  matchId?: string;
  matchReasons: string[];
  matchStatus?: string;
};

type ApiMatchRow = {
  _id: string;
  fitScore?: number;
  status?: string;
  reasons?: string[];
  fitReasons?: string[];
  opportunity?: Opportunity & { _id?: string };
};

const STATUS_STYLES = {
  open: "bg-green-100 text-green-700 border-green-200",
  closing: "bg-orange-100 text-orange-700 border-orange-200",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
};

const formatAmountRange = (min?: number, max?: number): string | null => {
  const fmt = (n: number) => "$" + n.toLocaleString();
  if (min != null && max != null && min > 0 && max > 0) return `${fmt(min)} – ${fmt(max)}`;
  if (max != null && max > 0) return `Up to ${fmt(max)}`;
  if (min != null && min > 0) return `From ${fmt(min)}`;
  return null;
};
const fmtDate = (d?: string) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const daysLeft = (d?: string) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

const scoreColor = (n: number | null) => {
  if (n === null) return { border: "border-[#d1d5db]", text: "text-[#6b7280]", bg: "bg-[#f9fafb]" };
  if (n >= 75) return { border: "border-[#22c55e]", text: "text-[#22c55e]", bg: "bg-[#f0fdf4]" };
  if (n >= 50) return { border: "border-[#f97316]", text: "text-[#f97316]", bg: "bg-[#fff7ed]" };
  return { border: "border-[#ef4444]", text: "text-[#ef4444]", bg: "bg-[#fff1f0]" };
};

const inputCls =
  "w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20";

function mergeRankedOpportunities(matches: ApiMatchRow[], opportunities: Opportunity[]): RankedOpportunity[] {
  const byOpp = new Map<string, RankedOpportunity>();

  for (const m of matches) {
    const opp = m.opportunity;
    const oid = opp?._id ? String(opp._id) : null;
    if (!oid || !opp?.title) continue;
    const reasons = [...(m.fitReasons || []), ...(m.reasons || [])].filter(Boolean);
    byOpp.set(oid, {
      ...opp,
      _id: oid,
      fitScore: m.fitScore ?? null,
      matchId: String(m._id),
      matchReasons: reasons,
      matchStatus: m.status,
    });
  }

  const ranked = [...byOpp.values()].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));

  const unmatched = opportunities
    .filter((o) => !byOpp.has(String(o._id)))
    .map((o) => ({
      ...o,
      fitScore: null,
      matchReasons: [] as string[],
    }))
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  return [...ranked, ...unmatched];
}

export const Opportunities = () => {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedOpp, setSelectedOpp] = useState<RankedOpportunity | null>(null);

  const { data: matchRows = [], isLoading: matchesLoading } = useQuery<ApiMatchRow[]>({
    queryKey: [...qk.matches(), "for-opportunities"],
    queryFn: async () => {
      const res = await api.get("/matches", { params: { limit: 500 } });
      return res.data.data ?? [];
    },
  });

  const { data: oppPayload, isLoading: oppsLoading, isError, refetch } = useQuery<{ data: Opportunity[] }>({
    queryKey: qk.opportunities(),
    queryFn: async () => {
      const res = await api.get("/opportunities", { params: { limit: 500 } });
      return res.data;
    },
  });

  const opportunities = useMemo(() => oppPayload?.data ?? [], [oppPayload?.data]);
  const ranked = useMemo(() => mergeRankedOpportunities(matchRows, opportunities), [matchRows, opportunities]);

  const computeMutation = useMutation({
    mutationFn: () => api.post("/matches/compute-all", {}),
    onSuccess: (res) => {
      const msg = (res.data as { message?: string })?.message ?? "Scores updated.";
      toast({ title: "Match scores refreshed", description: msg });
      queryClient.invalidateQueries({ queryKey: qk.matches() });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: "Could not refresh scores", description: msg || "Try again.", variant: "destructive" });
    },
  });

  const filtered: RankedOpportunity[] = ranked.filter((o) => {
    const matchSearch =
      !search ||
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.funder.toLowerCase().includes(search.toLowerCase()) ||
      o.keywords?.some((k) => k.toLowerCase().includes(search.toLowerCase()));
    const matchCat =
      !categoryFilter ||
      (o.category || "").toLowerCase().includes(categoryFilter.toLowerCase()) ||
      o.keywords?.some((k) => k.toLowerCase().includes(categoryFilter.toLowerCase()));
    const matchStatus = !statusFilter || statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const categories = Array.from(
    new Set(opportunities.map((o) => o.category).filter(Boolean))
  ).sort() as string[];

  const generateMutation = useMutation({
    mutationFn: (opportunityId: string) => api.post("/applications/generate", { opportunityId }),
    onSuccess: (res) => {
      const id = res.data.data?._id ?? res.data.data?.id;
      toast({ title: "Ashleen is drafting your application", description: "You can review and edit each section on the next screen." });
      queryClient.invalidateQueries({ queryKey: qk.applications() });
      if (id) router.push(`/applications/${id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Could not start application",
        description: msg || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isLoading = matchesLoading || oppsLoading;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl sm:text-3xl tracking-[0.5px] uppercase leading-tight">
            Grant Opportunities
          </h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm max-w-xl">
            Ranked by how well each grant fits your agency. Apply with Ashleen AI to draft your submission.
          </p>
        </div>
        <button
          type="button"
          onClick={() => computeMutation.mutate()}
          disabled={computeMutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] [font-family:'Montserrat',Helvetica] hover:bg-[#f9fafb] transition-colors self-start disabled:opacity-60"
        >
          <RefreshCw size={16} className={computeMutation.isPending ? "animate-spin" : ""} />
          {computeMutation.isPending ? "Updating scores…" : "Refresh match scores"}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            className={cn(inputCls, "pl-9")}
            placeholder="Search by name, funder, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          className="w-full sm:w-48 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#ef3e34] focus:outline-none"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          list="category-options"
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <select
          className="w-full sm:w-40 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closing">Closing Soon</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
          {isLoading ? "Loading..." : `${filtered.length} opportunit${filtered.length !== 1 ? "ies" : "y"} (best match first)`}
        </span>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="[font-family:'Montserrat',Helvetica] text-red-600 text-base">Failed to load opportunities.</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d63029]"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-white animate-pulse border border-[#e5e7eb]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="[font-family:'Montserrat',Helvetica] text-[#6b7280] text-base">No opportunities match your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((opp) => {
            const days = daysLeft(opp.deadline);
            const urgentDeadline = days !== null && days >= 0 && days <= 14;
            const deadlineStr = fmtDate(opp.deadline);
            const isGenerating = generateMutation.isPending && generateMutation.variables === opp._id;
            const sc = scoreColor(opp.fitScore);

            return (
              <div
                key={opp._id}
                className="flex flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedOpp(opp)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-semibold [font-family:'Montserrat',Helvetica] uppercase tracking-wide",
                          STATUS_STYLES[opp.status] || STATUS_STYLES.open
                        )}
                      >
                        {opp.status === "closing" ? "Closing Soon" : opp.status}
                      </span>
                      <div
                        className={cn(
                          "flex h-8 min-w-[2.5rem] items-center justify-center rounded-full border-2 px-2",
                          sc.border,
                          sc.bg
                        )}
                        title={opp.fitScore === null ? "Run refresh match scores to rank this grant" : "Fit score for your agency"}
                      >
                        <span className={cn("[font-family:'Montserrat',Helvetica] text-xs font-bold", sc.text)}>
                          {opp.fitScore === null ? "—" : `${opp.fitScore}`}
                        </span>
                      </div>
                    </div>
                    <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-base leading-snug group-hover:text-[#ef3e34] transition-colors">
                      {opp.title}
                    </h3>
                    <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">{opp.funder}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-[#d1d5db] group-hover:text-[#ef3e34] transition-colors mt-1" />
                </div>

                <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280] leading-relaxed line-clamp-2">
                  {opp.description || "No description available."}
                </p>

                {opp.matchReasons.length > 0 && (
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#374151] leading-relaxed line-clamp-2 border-l-2 border-[#ef3e34]/40 pl-2">
                    <span className="font-semibold text-[#ef3e34]">Why it fits: </span>
                    {opp.matchReasons[0]}
                    {opp.matchReasons.length > 1 ? " …" : ""}
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  {formatAmountRange(opp.minAmount, opp.maxAmount) && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={13} className="text-[#9ca3af] shrink-0" />
                      <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827]">
                        {formatAmountRange(opp.minAmount, opp.maxAmount)}
                      </span>
                    </div>
                  )}
                  {deadlineStr && (
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className={cn("shrink-0", urgentDeadline ? "text-red-500" : "text-[#9ca3af]")} />
                      <span
                        className={cn(
                          "[font-family:'Montserrat',Helvetica] text-sm",
                          urgentDeadline ? "font-semibold text-red-600" : "text-[#374151]"
                        )}
                      >
                        {deadlineStr}
                        {urgentDeadline && ` · ${days}d left`}
                      </span>
                    </div>
                  )}
                  {opp.category && (
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-[#9ca3af] shrink-0" />
                      <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">{opp.category}</span>
                    </div>
                  )}
                </div>

                {opp.keywords && opp.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {opp.keywords.slice(0, 3).map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-xs [font-family:'Montserrat',Helvetica] text-[#6b7280]"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  className="mt-auto w-full rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-bold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  disabled={opp.status === "closed" || generateMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    generateMutation.mutate(opp._id);
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Ashleen is working…
                    </>
                  ) : opp.status === "closed" ? (
                    "Closed"
                  ) : (
                    <>
                      <Sparkles size={14} className="shrink-0" />
                      Apply with Ashleen AI
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedOpp && (
        <OppDetailModal
          opp={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onApply={() => generateMutation.mutate(selectedOpp._id)}
          applying={generateMutation.isPending}
        />
      )}
    </div>
  );
};

const OppDetailModal = ({
  opp,
  onClose,
  onApply,
  applying,
}: {
  opp: RankedOpportunity;
  onClose: () => void;
  onApply: () => void;
  applying: boolean;
}) => {
  const days = daysLeft(opp.deadline);
  const urgentDeadline = days !== null && days >= 0 && days <= 14;
  const sc = scoreColor(opp.fitScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] p-6">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "self-start rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide [font-family:'Montserrat',Helvetica]",
                  STATUS_STYLES[opp.status] || STATUS_STYLES.open
                )}
              >
                {opp.status === "closing" ? "Closing Soon" : opp.status}
              </span>
              <div
                className={cn(
                  "flex h-9 min-w-[2.75rem] items-center justify-center rounded-full border-2 px-2.5",
                  sc.border,
                  sc.bg
                )}
              >
                <span className={cn("[font-family:'Montserrat',Helvetica] text-sm font-bold", sc.text)}>
                  {opp.fitScore === null ? "No score yet" : `${opp.fitScore}% fit`}
                </span>
              </div>
            </div>
            <h2 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl uppercase tracking-[0.3px] leading-tight">
              {opp.title}
            </h2>
            <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">{opp.funder}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {opp.matchReasons.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-[#fecaca] bg-[#fffafa] p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#ef3e34]" />
                <h4 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm uppercase tracking-wide">
                  Ashleen match analysis
                </h4>
              </div>
              <ul className="list-disc pl-4 [font-family:'Montserrat',Helvetica] text-sm text-[#374151] space-y-1">
                {opp.matchReasons.slice(0, 8).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
            {formatAmountRange(opp.minAmount, opp.maxAmount) && (
              <div className="flex flex-col gap-0.5">
                <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">
                  Award Amount
                </span>
                <span className="[font-family:'Montserrat',Helvetica] text-base font-bold text-[#111827]">
                  {formatAmountRange(opp.minAmount, opp.maxAmount)}
                </span>
              </div>
            )}
            {opp.deadline && (
              <div className="flex flex-col gap-0.5">
                <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">
                  Deadline
                </span>
                <span
                  className={cn(
                    "[font-family:'Montserrat',Helvetica] text-base font-bold",
                    urgentDeadline ? "text-red-600" : "text-[#111827]"
                  )}
                >
                  {fmtDate(opp.deadline)}
                  {urgentDeadline && <span className="ml-1 text-sm font-normal">({days}d left)</span>}
                </span>
              </div>
            )}
            {opp.category && (
              <div className="flex flex-col gap-0.5">
                <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">
                  Category
                </span>
                <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#374151]">{opp.category}</span>
              </div>
            )}
            {opp.agencyTypes && opp.agencyTypes.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">
                  Eligible Agencies
                </span>
                <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{opp.agencyTypes.join(", ")}</span>
              </div>
            )}
          </div>

          {opp.description && (
            <div className="flex flex-col gap-2">
              <h4 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm uppercase tracking-wide">Description</h4>
              <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151] leading-relaxed">{opp.description}</p>
            </div>
          )}

          {opp.keywords && opp.keywords.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm uppercase tracking-wide">Keywords</h4>
              <div className="flex flex-wrap gap-1.5">
                {opp.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-[#fef2f2] border border-[#fecaca] px-2.5 py-0.5 text-xs [font-family:'Montserrat',Helvetica] text-[#ef3e34] font-medium"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {opp.sourceUrl && opp.sourceUrl !== "#" && (
            <a
              href={opp.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#ef3e34] [font-family:'Montserrat',Helvetica] hover:underline"
            >
              <ExternalLink size={14} /> View Original Source
            </a>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-[#e5e7eb] p-5 sm:flex-row sm:items-center">
          <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280] sm:flex-1">
            Final match approval is completed by Red Dog staff in the admin portal.
          </p>
          <div className="flex items-center gap-3 sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] [font-family:'Montserrat',Helvetica] hover:bg-[#f9fafb]"
            >
              Close
            </button>
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              disabled={opp.status === "closed" || applying}
              className="rounded-lg bg-[#ef3e34] px-4 py-2.5 text-sm font-bold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {applying ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Working…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Apply with Ashleen AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
