"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type OppOpt = { _id: string; title: string; funder: string };
type FunderOpt = { _id: string; name: string };

const BUDGET_LABELS: Record<string, string> = {
  under_25k: "Under $25K",
  "25k_150k": "$25K – $150K",
  "150k_500k": "$150K – $500K",
  "500k_plus": "$500K+",
};

const TIMELINE_LABELS: Record<string, string> = {
  urgent: "Urgent",
  planned: "Planned / Long-term",
};

const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const fmt = (val: unknown) => (val != null && val !== "" ? String(val) : "—");

export default function AdminAgencyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"matches" | "applications" | "history">("matches");
  const [modal, setModal] = useState(false);
  const [funderId, setFunderId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [deleteAppId, setDeleteAppId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "agency", id],
    queryFn: async () => {
      const res = await adminApi.get(`admin/agencies/${id}`);
      return res.data.data;
    },
  });

  const { data: fundersData } = useQuery({
    queryKey: ["admin", "funders", "short"],
    queryFn: async () => {
      const res = await adminApi.get("admin/funders", { params: { limit: 200 } });
      return res.data.data as FunderOpt[];
    },
    enabled: modal,
  });

  const { data: opportunitiesData } = useQuery({
    queryKey: ["admin", "opportunities", "short"],
    queryFn: async () => {
      const res = await adminApi.get("admin/opportunities", { params: { limit: 200 } });
      return res.data.data as OppOpt[];
    },
    enabled: modal,
  });

  const genMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApi.post("admin/applications/create-for-agency", {
        agencyId: id,
        funderId,
        opportunityId,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "agency", id] });
      setModal(false);
      setFunderId("");
      setOpportunityId("");
      toast({ title: "Application created for agency" });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not create application";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (appId: string) => adminApi.delete(`admin/applications/${appId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "agency", id] });
      setDeleteAppId(null);
      toast({ title: "Application deleted" });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Delete failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setDeleteAppId(null);
    },
  });

  if (isLoading || !data) {
    return <p className="text-[#6b7280]">Loading agency…</p>;
  }

  const profile = data.profile;
  const matches = data.matches || [];
  const applications = data.applications || [];
  const history = data.submissionHistory || [];

  const appByOppId = new Map<string, { _id: string; status?: string }>();
  for (const a of applications as Record<string, unknown>[]) {
    const opp = a.opportunity as { _id?: string } | string | undefined | null;
    const oid =
      typeof opp === "string"
        ? opp
        : typeof opp === "object" && opp && "_id" in opp && opp._id != null
          ? String(opp._id)
          : "";
    if (oid) appByOppId.set(oid, { _id: String(a._id), status: String(a.status ?? "") });
  }

  const opportunityIdFromMatch = (m: Record<string, unknown>): string => {
    const raw = m.opportunity as { _id?: string } | string | undefined | null;
    if (raw == null) return "";
    if (typeof raw === "string") return raw;
    if (typeof raw === "object" && "_id" in raw && raw._id != null) return String(raw._id);
    return "";
  };

  const matchScoreForApp = (oppId: string) => {
    const m = matches.find((x: Record<string, unknown>) => opportunityIdFromMatch(x) === oppId) as
      | { fitScore?: number }
      | undefined;
    return m?.fitScore ?? null;
  };

  return (
    <div className="max-w-6xl space-y-6">
      <AdminBackLink href="/admin/agencies">Back to agencies</AdminBackLink>
      <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">{profile.name}</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Agency Profile</h2>
            <p className="text-sm text-gray-500">
              Member since{" "}
              {profile.createdAt
                ? new Date(String(profile.createdAt)).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                profile.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {profile.status ?? "active"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              {profile.matchCount ?? 0} matches
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Location
                </span>
                <p className="text-sm text-gray-800 mt-0.5">{fmt(profile.location)}</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Website
                </span>
                <p className="text-sm mt-0.5 break-all">
                  {profile.websiteUrl || profile.website ? (
                    <a
                      href={String(profile.websiteUrl || profile.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {String(profile.websiteUrl || profile.website)}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Owner Email
                </span>
                <p className="text-sm mt-0.5 break-all">
                  {profile.owner?.email ? (
                    <a
                      href={`mailto:${String(profile.owner.email)}`}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {String(profile.owner.email)}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Agency Types
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {Array.isArray(profile.agencyTypes) && profile.agencyTypes.length > 0 ? (
                  (profile.agencyTypes as string[]).map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 text-xs font-semibold"
                    >
                      {formatType(t)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Program Areas
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {Array.isArray(profile.programAreas) && profile.programAreas.length > 0 ? (
                  (profile.programAreas as string[]).map((a) => (
                    <span
                      key={a}
                      className="px-2.5 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold"
                    >
                      {formatType(a)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Mission Statement
              </span>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">
                {fmt(profile.missionStatement)}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Goals
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {Array.isArray(profile.goals) && profile.goals.length > 0 ? (
                  (profile.goals as string[]).map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold"
                    >
                      {formatType(String(g).replace(/-/g, " "))}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 font-medium">Population Served</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {profile.populationServed != null
                    ? Number(profile.populationServed).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 font-medium">Staff Count</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {profile.numberOfStaff != null
                    ? Number(profile.numberOfStaff).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 font-medium">Coverage Area</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {fmt(profile.coverageArea)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 font-medium">Local Match</p>
                <p className="text-sm font-semibold mt-0.5">
                  {profile.canMeetLocalMatch === true ? (
                    <span className="text-green-600">Yes ✓</span>
                  ) : profile.canMeetLocalMatch === false ? (
                    <span className="text-gray-500">No</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Budget Range
                </span>
                <p className="text-sm text-gray-800 mt-0.5">
                  {BUDGET_LABELS[String(profile.budgetRange)] ?? fmt(profile.budgetRange)}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Timeline
                </span>
                <p className="text-sm text-gray-800 mt-0.5">
                  {TIMELINE_LABELS[String(profile.timeline)] ?? fmt(profile.timeline)}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Last Match Recomputed
                </span>
                <p className="text-sm text-gray-800 mt-0.5">
                  {profile.lastMatchRecomputedAt
                    ? new Date(String(profile.lastMatchRecomputedAt)).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Total Matches
                </span>
                <p className="text-sm text-gray-800 mt-0.5">{profile.matchCount ?? 0}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Current Equipment
              </span>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">
                {fmt(profile.currentEquipment)}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Main Problems
              </span>
              {Array.isArray(profile.mainProblems) && profile.mainProblems.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {(profile.mainProblems as string[]).map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                      <span className="text-red-400 mt-0.5">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 mt-1">—</p>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Funding Priorities
              </span>
              {Array.isArray(profile.fundingPriorities) && profile.fundingPriorities.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {(profile.fundingPriorities as string[]).map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 mt-1">—</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#e5e7eb] pb-2">
        {(["matches", "applications", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 text-sm capitalize ${
              tab === t
                ? "bg-[#ef3e341a] font-semibold text-[#ef3e34]"
                : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "matches" && (
        <ul className="space-y-3">
          {matches.map((m: Record<string, unknown>) => {
            const oppId = opportunityIdFromMatch(m);
            const linked = oppId ? appByOppId.get(oppId) : undefined;
            const opp = m.opportunity as { _id?: string; funder?: string; title?: string } | string | undefined;
            const oppTitle =
              typeof opp === "object" && opp ? opp.title : undefined;
            const oppFunder =
              typeof opp === "object" && opp ? opp.funder : undefined;
            return (
              <li key={String(m._id)} className="rounded border border-[#e5e7eb] bg-white p-4 shadow-sm">
                <p className="font-medium text-[#111827]">{oppFunder ?? "—"}</p>
                <p className="text-sm text-[#6b7280]">{oppTitle ?? "—"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    {String(m.fitScore)} score
                  </span>
                  <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#4b5563]">{String(m.tier)}</span>
                  {linked ? (
                    <span className="rounded bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#15803d]">
                      Has application
                    </span>
                  ) : (
                    <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#6b7280]">No application yet</span>
                  )}
                </div>
                <ul className="mt-2 list-disc pl-4 text-xs text-[#9ca3af]">
                  {((m.reasons as string[]) || []).slice(0, 6).map((x, i) => (
                    <li key={`${i}-${x}`}>{x}</li>
                  ))}
                </ul>
                <div className="mt-3">
                  {linked ? (
                    <Link
                      href={`/admin/applications/${linked._id}`}
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#111827] shadow-sm",
                        "hover:bg-[#f9fafb] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#ef3e34] focus-visible:ring-offset-2"
                      )}
                    >
                      View application
                    </Link>
                  ) : (
                    <span
                      className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-4 text-sm font-medium text-[#9ca3af]"
                      aria-disabled="true"
                    >
                      No application yet
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "applications" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#6b7280]">
              Draft applications created for this agency (including staff-generated drafts).
            </p>
            <Button className="bg-[#ef3e34] hover:bg-[#d63530] text-white" onClick={() => setModal(true)}>
              Create Application for Agency
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f9fafb] text-[#6b7280]">
                <tr>
                  <th className="p-3">Opportunity</th>
                  <th className="p-3">Funder</th>
                  <th className="p-3">Match score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-[#9ca3af]">
                      No applications yet. Use &quot;Create Application for Agency&quot; to generate a draft.
                    </td>
                  </tr>
                ) : (
                  (applications as Record<string, unknown>[]).map((a) => {
                    const opp = a.opportunity as { title?: string; funder?: string; _id?: string } | undefined;
                    const oppKey = opp?._id ? String(opp._id) : "";
                    const score = oppKey ? matchScoreForApp(oppKey) : null;
                    const funderName =
                      (a.funder as { name?: string })?.name || opp?.funder || "—";
                    return (
                      <tr key={String(a._id)} className="border-t border-[#f0f0f0]">
                        <td className="p-3 font-medium text-[#111827]">{opp?.title || "—"}</td>
                        <td className="p-3 text-[#6b7280]">{funderName}</td>
                        <td className="p-3 text-[#374151]">{score != null ? String(score) : "—"}</td>
                        <td className="p-3">
                          <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs capitalize text-[#374151]">
                            {String(a.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-3 text-[#6b7280]">
                          {a.createdAt ? new Date(String(a.createdAt)).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" className="border-[#e5e7eb]" asChild>
                              <Link href={`/admin/applications/${String(a._id)}`}>View</Link>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteAppId(String(a._id))}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "history" && (
        <ul className="space-y-2 text-sm">
          {history.map((h: Record<string, unknown>, i: number) => (
            <li key={i} className="border-b border-[#f0f0f0] pb-2 text-[#6b7280]">
              {String(h.changedAt)} — {String(h.previousStatus)} → {String(h.status)} (app {String(h.applicationId)})
            </li>
          ))}
        </ul>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Application on Behalf of {profile.name}</DialogTitle>
            <DialogDescription>
              Red Dog staff will generate a draft AI application. The agency will be able to view and edit it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-[#374151]">Select Opportunity</p>
              <Select value={opportunityId} onValueChange={setOpportunityId}>
                <SelectTrigger className="border-[#e5e7eb]">
                  <SelectValue placeholder="Choose opportunity" />
                </SelectTrigger>
                <SelectContent>
                  {(opportunitiesData || []).map((o) => (
                    <SelectItem key={o._id} value={o._id}>
                      {o.title} — {o.funder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[#374151]">Select Funder</p>
              <Select value={funderId} onValueChange={setFunderId}>
                <SelectTrigger className="border-[#e5e7eb]">
                  <SelectValue placeholder="Choose funder" />
                </SelectTrigger>
                <SelectContent>
                  {(fundersData || []).map((f) => (
                    <SelectItem key={f._id} value={f._id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {genMutation.isPending && (
            <p className="text-sm text-[#d97706]">Generating draft application…</p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={!funderId || !opportunityId || genMutation.isPending}
              className="bg-[#ef3e34] hover:bg-[#d63530] text-white"
              onClick={() => genMutation.mutate()}
            >
              Generate Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAppId} onOpenChange={() => setDeleteAppId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the application record. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteAppId && deleteMutation.mutate(deleteAppId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
