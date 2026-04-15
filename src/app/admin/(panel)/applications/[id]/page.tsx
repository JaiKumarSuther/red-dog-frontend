"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import { Building2, ChevronDown, ChevronUp, ExternalLink, User as UserIcon } from "lucide-react";

const BUDGET_LABELS: Record<string, string> = {
  under_25k: "Under $25K",
  "25k_150k": "$25K – $150K",
  "150k_500k": "$150K – $500K",
  "500k_plus": "$500K+",
};

const formatAgencyType = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const dash = (v: unknown) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string" && v.trim() === "") return "—";
  return String(v);
};

const formatMemberSince = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return "—";
  }
};

const KEYS = [
  "problemStatement",
  "communityImpact",
  "proposedSolution",
  "measurableOutcomes",
  "urgency",
  "budgetSummary",
] as const;

type Breakdown = Record<string, number> | undefined;

export default function AdminApplicationDetailPage() {
  const { id } = useParams();
  const appId = typeof id === "string" ? id : id?.[0] ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [agencyExpanded, setAgencyExpanded] = useState(true);
  const notesHydrated = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "application", appId],
    queryFn: async () => {
      const res = await adminApi.get(`admin/applications/${appId}`);
      return res.data.data as Record<string, unknown> & {
        fitScore?: number | null;
        matchBreakdown?: Breakdown;
        matchReasons?: string[];
      };
    },
    enabled: Boolean(appId),
  });

  useEffect(() => {
    notesHydrated.current = false;
  }, [appId]);

  useEffect(() => {
    if (!data || notesHydrated.current) return;
    setNotes(String(data.notes ?? ""));
    notesHydrated.current = true;
  }, [data]);

  const saveNotes = useMutation({
    mutationFn: () => adminApi.put(`admin/applications/${appId}`, { notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "application", appId] });
      toast({ title: "Notes saved" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (body: { status: string; notes?: string }) =>
      adminApi.put(`admin/applications/${appId}/status`, body),
    onSuccess: () => {
      notesHydrated.current = false;
      qc.invalidateQueries({ queryKey: ["admin", "application", appId] });
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
      toast({ title: "Status updated" });
      setApproveOpen(false);
      setAwardOpen(false);
      setRejectOpen(false);
      setRejectReason("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Update failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const regen = useMutation({
    mutationFn: () => adminApi.post(`admin/applications/${appId}/generate-ai`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "application", appId] });
      toast({ title: "AI content regenerated" });
    },
  });

  if (!appId) return null;
  if (isLoading || !data) return <p className="text-[#6b7280]">Loading…</p>;

  const status = String(data.status ?? "");
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const canMarkAwarded = status === "approved" || status === "submitted";
  const fitScore = data.fitScore;
  const breakdown = data.matchBreakdown;
  const matchReasons = data.matchReasons ?? [];
  const org = data.organization as Record<string, unknown> | undefined;
  const orgId =
    (org as { _id?: unknown })?._id != null
      ? String((org as { _id?: unknown })._id)
      : typeof data.organization === "string"
        ? String(data.organization)
        : "";
  const submittedBy = (data as { submittedBy?: unknown }).submittedBy as
    | { firstName?: string; lastName?: string; email?: string; role?: string; createdAt?: string }
    | undefined;

  const onConfirmApprove = () => {
    // Close immediately so the dialog doesn't bounce open on fast clicks/rerenders.
    setApproveOpen(false);
    statusMutation.mutate({ status: "approved" });
  };

  const onConfirmAwarded = () => {
    setAwardOpen(false);
    statusMutation.mutate({ status: "awarded" });
  };

  const onConfirmReject = () => {
    setRejectOpen(false);
    const base = String(data.notes || "").trim();
    const reason = rejectReason.trim();
    const merged = reason ? (base ? `${base}\nRejection reason: ${reason}` : `Rejection reason: ${reason}`) : base;
    statusMutation.mutate({ status: "rejected", notes: merged || undefined });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <AdminBackLink href="/admin/applications">Back to applications</AdminBackLink>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Application</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            {(data.organization as { name?: string })?.name ?? "Agency"} ·{" "}
            {(data.opportunity as { title?: string })?.title ?? "Opportunity"}
          </p>
          <p className="mt-2">
            <span className="text-xs uppercase text-[#9ca3af]">Status</span>{" "}
            <span className="ml-2 rounded bg-[#f3f4f6] px-2 py-0.5 text-sm capitalize text-[#374151]">
              {status.replace(/_/g, " ")}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isApproved && (
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={statusMutation.isPending}
              onClick={() => setApproveOpen(true)}
            >
              Approve
            </Button>
          )}
          {canMarkAwarded && (
            <Button
              type="button"
              className="bg-amber-500 text-white hover:bg-amber-600"
              disabled={statusMutation.isPending}
              onClick={() => setAwardOpen(true)}
            >
              Mark as Awarded
            </Button>
          )}
          {!isRejected && (
            <Button
              type="button"
              variant="destructive"
              disabled={statusMutation.isPending}
              onClick={() => setRejectOpen(true)}
            >
              Reject Application
            </Button>
          )}
        </div>
      </div>

      {org && (
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setAgencyExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#ef3e34]" />
              <h2 className="[font-family:'Montserrat',Helvetica] text-sm font-bold uppercase tracking-wide text-[#111827]">
                Agency Profile
              </h2>
            </div>
            {agencyExpanded ? (
              <ChevronUp size={18} className="text-[#9ca3af]" />
            ) : (
              <ChevronDown size={18} className="text-[#9ca3af]" />
            )}
          </button>

          {agencyExpanded && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">Agency Name</span>
                    <span className="font-semibold text-[#111827]">{dash(org.name)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">Location</span>
                    <span className="text-[#111827]">{dash(org.location)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#6b7280]">Website</span>
                    {String((org.websiteUrl ?? org.website ?? "") || "").trim() ? (
                      <a
                        href={String((org.websiteUrl ?? org.website) as string)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        Visit <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-[#111827]">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">Status</span>
                    {String(org.status || "").toLowerCase() === "active" ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : String(org.status || "").trim() ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        {String(org.status)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        —
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Agency Types</p>
                  {Array.isArray(org.agencyTypes) && org.agencyTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(org.agencyTypes as string[]).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#ef3e34]/40 bg-[#fff4f4] px-2 py-0.5 text-xs font-semibold text-[#ef3e34]"
                        >
                          {formatAgencyType(t)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6b7280]">—</p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Program Areas</p>
                  {Array.isArray(org.programAreas) && org.programAreas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(org.programAreas as string[]).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#ef3e34]/20 bg-white px-2 py-0.5 text-xs font-semibold text-[#ef3e34]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6b7280]">—</p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Mission Statement</p>
                  <p className="whitespace-pre-wrap text-sm text-[#374151]">
                    {dash(org.missionStatement)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-[#f0f0f0] bg-[#fafafa] p-3">
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">Population Served</p>
                    <p className="mt-1 font-semibold text-[#111827]">
                      {org.populationServed != null ? Number(org.populationServed).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#f0f0f0] bg-[#fafafa] p-3">
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">Number of Staff</p>
                    <p className="mt-1 font-semibold text-[#111827]">
                      {org.numberOfStaff != null ? Number(org.numberOfStaff).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#f0f0f0] bg-[#fafafa] p-3 col-span-2">
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">Coverage Area</p>
                    <p className="mt-1 text-[#111827]">{dash(org.coverageArea)}</p>
                  </div>
                  <div className="rounded-md border border-[#f0f0f0] bg-[#fafafa] p-3 col-span-2">
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">Can Meet Local Match</p>
                    <p className="mt-1 font-semibold">
                      {org.canMeetLocalMatch === true ? (
                        <span className="text-green-700">Yes ✓</span>
                      ) : org.canMeetLocalMatch === false ? (
                        <span className="text-gray-700">No</span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Current Equipment</p>
                  <p className="whitespace-pre-wrap text-sm text-[#374151]">{dash(org.currentEquipment)}</p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Main Problems</p>
                  {Array.isArray(org.mainProblems) && org.mainProblems.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-[#374151] space-y-1">
                      {(org.mainProblems as string[]).slice(0, 10).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#6b7280]">—</p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Funding Priorities</p>
                  {Array.isArray(org.fundingPriorities) && org.fundingPriorities.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-[#374151] space-y-1">
                      {(org.fundingPriorities as string[]).slice(0, 10).map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#6b7280]">—</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-[#f0f0f0] bg-[#fafafa] p-3">
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">Budget Range</p>
                    <p className="mt-1 font-semibold text-[#111827]">
                      {org.budgetRange ? (BUDGET_LABELS[String(org.budgetRange)] || String(org.budgetRange)) : "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#f0f0f0] bg-[#fafafa] p-3">
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">Timeline</p>
                    <p className="mt-1 font-semibold text-[#111827]">{dash(org.timeline)}</p>
                  </div>
                  <div className="rounded-md border border-[#f0f0f0] bg-[#fafafa] p-3 col-span-2">
                    <p className="text-xs text-[#9ca3af] uppercase tracking-wide font-semibold">Total Matches</p>
                    <p className="mt-1 font-semibold text-[#111827]">{org.matchCount != null ? String(org.matchCount) : "—"}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 mt-2 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={orgId ? `/admin/agencies/${orgId}` : "/admin/agencies"}
                  className="inline-flex items-center justify-center rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                >
                  View Full Agency Profile
                </Link>
                <Link
                  href={orgId ? `/admin/applications?org=${encodeURIComponent(orgId)}` : "/admin/applications"}
                  className="inline-flex items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb]"
                >
                  View All Applications
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <UserIcon size={16} className="text-[#6b7280]" />
          <h2 className="[font-family:'Montserrat',Helvetica] text-sm font-bold uppercase tracking-wide text-[#111827]">
            Submitted By
          </h2>
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Full name</span>
            <span className="font-semibold text-[#111827]">
              {submittedBy?.firstName || submittedBy?.lastName
                ? `${submittedBy?.firstName || ""} ${submittedBy?.lastName || ""}`.trim()
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#6b7280]">Email</span>
            {submittedBy?.email ? (
              <a className="text-blue-600 hover:underline" href={`mailto:${submittedBy.email}`}>
                {submittedBy.email}
              </a>
            ) : (
              <span className="text-[#111827]">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Role</span>
            {submittedBy?.role ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {submittedBy.role}
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                —
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6b7280]">Member since</span>
            <span className="text-[#111827]">{formatMemberSince(submittedBy?.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
          Match fit (this agency × this opportunity)
        </h2>
        <p className="mt-2 text-[#111827]">
          <span className="text-[#6b7280]">Fit score:</span>{" "}
          <span className="text-lg font-bold">{fitScore != null ? fitScore : "—"}</span>
        </p>
        {breakdown && Object.keys(breakdown).length > 0 && (
          <ul className="mt-2 grid gap-1 text-xs text-[#6b7280] sm:grid-cols-2">
            {Object.entries(breakdown).map(([k, v]) => (
              <li key={k}>
                <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}:</span> {String(v)}
              </li>
            ))}
          </ul>
        )}
        {matchReasons.length > 0 && (
          <ul className="mt-2 list-disc pl-4 text-xs text-[#6b7280]">
            {matchReasons.slice(0, 8).map((r, i) => (
              <li key={`${i}-${r}`}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-[#ef3e34] hover:bg-[#d63530] text-white"
          onClick={() => regen.mutate()}
          disabled={regen.isPending}
        >
          {regen.isPending ? "Regenerating…" : "Regenerate with AI"}
        </Button>
      </div>

      <div>
        <p className="mb-1 text-xs text-[#6b7280]">Staff notes</p>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="border-[#e5e7eb]" />
        <Button className="mt-2" variant="outline" onClick={() => saveNotes.mutate()} disabled={saveNotes.isPending}>
          Save notes
        </Button>
      </div>

      {KEYS.map((k) => (
        <div key={k} className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold capitalize text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
            {k.replace(/([A-Z])/g, " $1")}
          </h2>
          <p className="whitespace-pre-wrap text-sm text-[#374151]">{String(data[k] || "—")}</p>
        </div>
      ))}

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this application? The agency will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onConfirmApprove}
              disabled={statusMutation.isPending}
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={awardOpen} onOpenChange={setAwardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this application as awarded?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this application as awarded? This will record it as a win for the agency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 text-white hover:bg-amber-600"
              onClick={onConfirmAwarded}
              disabled={statusMutation.isPending}
            >
              Mark as Awarded
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this application? Add a reason (optional):
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="border-[#e5e7eb]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={onConfirmReject}
              disabled={statusMutation.isPending}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
