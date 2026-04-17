"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { Badge } from "@/components/ui/badge";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

type Breakdown = Record<string, number> | undefined;

type MatchRow = {
  _id: string;
  agencyName?: string;
  organization?: { name?: string };
  opportunity?: { title?: string; funder?: string };
  fitScore?: number;
  breakdown?: Breakdown;
  matchReasons?: string[];
  lastUpdated?: string;
  updatedAt?: string;
  linkedApplication?: { _id: string; status: string } | null;
};

type SortKey = "agency" | "opportunity" | "fitScore" | "appStatus";

function appStatusBadgeCls(s: string) {
  if (s === "approved" || s === "awarded") return "bg-[#dcfce7] text-[#16a34a]";
  if (s === "rejected" || s === "denied") return "bg-[#fee2e2] text-[#b91c1c]";
  if (s === "submitted" || s === "in_review") return "bg-[#dbeafe] text-[#1d4ed8]";
  return "bg-[#f3f4f6] text-[#374151]";
}

function scoreBadgeCls(score?: number) {
  if (typeof score !== "number") return "bg-[#f3f4f6] text-[#374151]";
  if (score >= 85) return "bg-[#dcfce7] text-[#166534]";
  if (score >= 70) return "bg-[#dbeafe] text-[#1e40af]";
  if (score >= 50) return "bg-[#fef9c3] text-[#854d0e]";
  return "bg-[#fee2e2] text-[#991b1b]";
}

export default function AdminMatchesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [tier, setTier] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fitScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [recomputeOpen, setRecomputeOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "matches", page, tier, agencyFilter],
    queryFn: async () => {
      const res = await adminApi.get("admin/matches", {
        params: {
          page,
          limit: 30,
          tier: tier || undefined,
          agencyId: agencyFilter || undefined,
        },
      });
      return res.data as {
        data: MatchRow[];
        pagination?: {
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          hasNextPage?: boolean;
          hasPrevPage?: boolean;
        };
      };
    },
  });

  const rowsRaw = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;

  const sortedRows = useMemo(() => {
    const copy = [...rowsRaw];
    const mult = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const agencyA = a.agencyName ?? a.organization?.name ?? "";
      const agencyB = b.agencyName ?? b.organization?.name ?? "";
      const oppA = a.opportunity?.title ?? a.opportunity?.funder ?? "";
      const oppB = b.opportunity?.title ?? b.opportunity?.funder ?? "";
      const stA = a.linkedApplication?.status ?? "";
      const stB = b.linkedApplication?.status ?? "";
      if (sortKey === "agency") return agencyA.localeCompare(agencyB) * mult;
      if (sortKey === "opportunity") return oppA.localeCompare(oppB) * mult;
      if (sortKey === "fitScore") return ((a.fitScore ?? 0) - (b.fitScore ?? 0)) * mult;
      if (sortKey === "appStatus") return stA.localeCompare(stB) * mult;
      return 0;
    });
    return copy;
  }, [rowsRaw, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "agency" || key === "opportunity" || key === "appStatus" ? "asc" : "desc");
    }
  };

  const recomputeMutation = useMutation({
    mutationFn: () => adminApi.post("admin/matches/recompute-all"),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["admin", "matches"] });
      const processed = (res.data?.data as { processed?: number })?.processed;
      toast({
        title: "Recompute complete",
        description:
          typeof processed === "number" ? `${processed} organization–opportunity pairs updated.` : undefined,
      });
      setRecomputeOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Recompute failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setRecomputeOpen(false);
    },
  });

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="px-4 py-3">
      <button
        type="button"
        className={`inline-flex items-center gap-1 font-semibold ${
          sortKey === k ? "text-[#111827]" : "text-[#374151] hover:text-[#111827]"
        }`}
        onClick={() => toggleSort(k)}
      >
        {label}
        <span className="text-xs text-[#9ca3af]">{sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
      </button>
    </th>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Matches</h1>
            <p className="text-sm text-[#6b7280]">
              Fit scores are computed for each agency–opportunity pair. Approve or reject{" "}
              <span className="font-medium text-[#374151]">applications</span> after an agency submits — not matches
              here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#e5e7eb] bg-white"
                  disabled={recomputeMutation.isPending}
                  onClick={() => setRecomputeOpen(true)}
                >
                  {recomputeMutation.isPending ? "Recomputing…" : "Recompute all"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Recompute match scores for all pairs</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-9 rounded-md border border-[#e5e7eb] bg-white px-2 text-sm text-[#111827]"
                value={tier}
                onChange={(e) => {
                  setTier(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All tiers</option>
                <option value="high">High fit</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <Input
                placeholder="Filter by Agency ID"
                className="h-9 w-60 border-[#e5e7eb]"
                value={agencyFilter}
                onChange={(e) => {
                  setAgencyFilter(e.target.value);
                  setPage(1);
                }}
              />

              {(tier || agencyFilter) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 border-[#e5e7eb] bg-white"
                  onClick={() => {
                    setTier("");
                    setAgencyFilter("");
                    setPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" type="button" className="h-9" onClick={() => refetch()}>
                Refresh
              </Button>
              {pagination?.total ? (
                <span className="text-xs text-[#6b7280]">
                  {pagination.total.toLocaleString()} total · page {pagination.page ?? page} of {pagination.totalPages ?? 1}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white text-sm shadow-sm">
        <table className="w-full min-w-[860px] text-left">
            <thead className="sticky top-0 z-10 bg-[#f9fafb] text-[#6b7280]">
            <tr>
              <Th k="agency" label="Agency" />
              <Th k="opportunity" label="Opportunity" />
              <Th k="fitScore" label="Fit score" />
              <Th k="appStatus" label="Application status" />
              <th className="w-14 px-4 py-3 text-right font-semibold text-[#374151]" aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-[#9ca3af]">
                  Loading…
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-[#9ca3af]">
                  No matches found
                </td>
              </tr>
            ) : (
              sortedRows.map((m) => {
                const agency = m.agencyName ?? m.organization?.name ?? "—";
                const oppTitle = m.opportunity?.title ?? "—";
                const oppFunder = m.opportunity?.funder;
                const app = m.linkedApplication;
                return (
                  <tr key={m._id} className="border-t border-[#f0f0f0] hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#111827]">{agency}</div>
                      <div className="mt-0.5 text-xs text-[#9ca3af]">{m._id}</div>
                    </td>
                    <td className="max-w-[360px] px-4 py-3">
                      <div className="font-medium text-[#111827]">{oppTitle}</div>
                      {oppFunder ? <div className="mt-0.5 text-xs text-[#6b7280]">{oppFunder}</div> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${scoreBadgeCls(m.fitScore)} border-0`}>
                        {typeof m.fitScore === "number" ? m.fitScore : "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {app ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${appStatusBadgeCls(app.status)}`}
                        >
                          {app.status.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">No application yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminTableViewLink href={`/admin/matches/${m._id}`} label="View match details" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (pagination.totalPages ?? 1) > 1 && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b7280]">
          <span>
            Page {pagination.page ?? page} of {pagination.totalPages ?? 1}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={recomputeOpen} onOpenChange={setRecomputeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recompute all matches?</AlertDialogTitle>
            <AlertDialogDescription>
              This recomputes scores for every active organization and opportunity pair. It may take a minute on large
              datasets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => recomputeMutation.mutate()}>Start recompute</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
