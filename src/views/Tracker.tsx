"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";

interface TrackerApp {
  _id: string;
  projectTitle?: string;
  status: string;
  dateStarted?: string;
  dateSubmitted?: string;
  followUpDate?: string;
  notes?: string;
  funder?: { name: string; avgGrantMax?: number };
  opportunity?: { title: string; funder: string };
  organization?: { name: string };
}

interface TrackerStats {
  totalMatchedFunders: number;
  applicationsInProgress: number;
  submittedApplications: number;
  awardsWon: number;
  totalDollarsRequested: number;
  totalDollarsAwarded: number;
}

// Full list used only for the filter tabs (showing existing statuses from any source)
const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "draft", label: "Draft" },
  { value: "drafting", label: "Drafting" },
  { value: "ready_to_submit", label: "Ready to Submit" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In Review" },
  { value: "follow_up_needed", label: "Follow-up Needed" },
  { value: "awarded", label: "Awarded" },
  { value: "denied", label: "Denied" },
];

// What agency users may SET — all other statuses are admin-controlled (read-only)
const AGENCY_STATUS_OPTIONS = [
  { value: "drafting", label: "Drafting" },
  { value: "ready_to_submit", label: "Ready to Submit" },
  { value: "submitted", label: "Submitted" },
  { value: "withdrawn", label: "Withdrawn" },
];

// Statuses that an admin has set — agency cannot change these inline
const TRACKER_ADMIN_STATUSES = ["in_review", "awarded", "denied", "declined", "rejected", "approved", "under_review", "under-review"];

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  draft: "bg-gray-100 text-gray-700",
  drafting: "bg-blue-100 text-blue-700",
  ready_to_submit: "bg-purple-100 text-purple-700",
  submitted: "bg-orange-100 text-orange-700",
  in_review: "bg-yellow-100 text-yellow-700",
  follow_up_needed: "bg-yellow-100 text-yellow-800",
  awarded: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

const fmt = (n: number) =>
  n >= 1000000
    ? "$" + (n / 1000000).toFixed(1) + "M"
    : n >= 1000
    ? "$" + Math.round(n / 1000) + "K"
    : "$" + n;

export const Tracker = () => {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const { data: stats } = useQuery<TrackerStats>({
    queryKey: qk.trackerStats(),
    queryFn: async () => {
      const res = await api.get("/tracker/stats");
      return res.data.data;
    },
  });

  const { data, isLoading, isError, refetch } = useQuery<{ data: TrackerApp[] }>({
    queryKey: [...qk.tracker(), statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "100" };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get("/tracker", { params });
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/applications/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tracker() });
      queryClient.invalidateQueries({ queryKey: qk.trackerStats() });
      toast({ title: "Status updated" });
    },
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.put(`/applications/${id}`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tracker() });
      setEditingNotes(null);
      toast({ title: "Notes saved" });
    },
  });

  const apps: TrackerApp[] = data?.data ?? [];

  const statCards = [
    { label: "Matched Funders", value: stats?.totalMatchedFunders ?? "—", color: "text-[#50a2ff]" },
    { label: "In Progress", value: stats?.applicationsInProgress ?? "—", color: "text-[#feb900]" },
    { label: "Submitted", value: stats?.submittedApplications ?? "—", color: "text-[#f97316]" },
    { label: "Awarded", value: stats?.awardsWon ?? "—", color: "text-[#22c55e]" },
    { label: "$ Requested", value: stats ? fmt(stats.totalDollarsRequested) : "—", color: "text-[#c17aff]" },
    { label: "$ Awarded", value: stats ? fmt(stats.totalDollarsAwarded) : "—", color: "text-[#ef3e34]" },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
      <div>
        <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl sm:text-3xl tracking-[0.5px] uppercase leading-tight">
          Submission Tracker
        </h1>
        <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm mt-1">
          Track and manage all your grant applications in one place
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e5e7eb] bg-white p-4 flex flex-col gap-1">
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280] font-medium">{s.label}</p>
            <p className={`[font-family:'Oswald',Helvetica] font-bold text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {["all", ...STATUS_OPTIONS.map((s) => s.value)].map((v) => {
            const label = v === "all" ? "All" : STATUS_OPTIONS.find((s) => s.value === v)?.label || v;
            return (
              <button
                key={v}
                onClick={() => setStatusFilter(v)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold [font-family:'Montserrat',Helvetica] transition-colors ${
                  statusFilter === v
                    ? "bg-[#ef3e34] text-white"
                    : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f9fafb]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          title="Refresh"
          className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#6b7280] [font-family:'Montserrat',Helvetica] hover:bg-[#f9fafb] disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {isError && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <p className="[font-family:'Montserrat',Helvetica] text-red-600 text-sm">Failed to load tracker data. Please try again.</p>
          <button onClick={() => refetch()} className="rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-semibold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029]">Retry</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-[#e5e7eb]">
              {["Funder / Project", "Date Started", "Date Submitted", "Status", "Follow-up Date", "Notes", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left [font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#9ca3af] uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[#e5e7eb]">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : apps.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center [font-family:'Montserrat',Helvetica] text-[#9ca3af] text-sm">
                  No applications found
                </td>
              </tr>
            ) : (
              apps.map((app) => {
                const funderName = app.funder?.name || app.opportunity?.funder || "—";
                const isFollowUpDue =
                  app.followUpDate && new Date(app.followUpDate) <= new Date(Date.now() + 3 * 86400000);

                return (
                  <tr key={app._id} className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]">
                    <td className="px-4 py-4">
                      <p className="[font-family:'Montserrat',Helvetica] font-semibold text-sm text-[#111827]">{funderName}</p>
                      {app.projectTitle && (
                        <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] mt-0.5">{app.projectTitle}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 [font-family:'Montserrat',Helvetica] text-sm text-[#374151]">
                      {app.dateStarted ? new Date(app.dateStarted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-4 [font-family:'Montserrat',Helvetica] text-sm text-[#374151]">
                      {app.dateSubmitted ? new Date(app.dateSubmitted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {TRACKER_ADMIN_STATUSES.includes(app.status) ? (
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold [font-family:'Montserrat',Helvetica] ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_OPTIONS.find((s) => s.value === app.status)?.label ?? app.status.replace(/_/g, " ")}
                          </span>
                          <span className="[font-family:'Montserrat',Helvetica] text-[10px] text-[#9ca3af] italic pl-0.5">set by staff</span>
                        </div>
                      ) : (
                        <select
                          value={AGENCY_STATUS_OPTIONS.find((s) => s.value === app.status) ? app.status : ""}
                          onChange={(e) => e.target.value && statusMutation.mutate({ id: app._id, status: e.target.value })}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold [font-family:'Montserrat',Helvetica] border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20 ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {!AGENCY_STATUS_OPTIONS.find((s) => s.value === app.status) && (
                            <option value="" disabled>
                              {app.status.replace(/_/g, " ")}
                            </option>
                          )}
                          {AGENCY_STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {app.followUpDate ? (
                        <span className={`[font-family:'Montserrat',Helvetica] text-sm ${isFollowUpDue ? "font-semibold text-red-600" : "text-[#374151]"}`}>
                          {new Date(app.followUpDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {isFollowUpDue && " ⚠"}
                        </span>
                      ) : (
                        <span className="text-[#9ca3af] text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 max-w-[180px]">
                      {editingNotes === app._id ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            className="w-full rounded border border-[#e5e7eb] px-2 py-1 text-xs [font-family:'Montserrat',Helvetica] text-[#111827] focus:outline-none"
                            rows={2}
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => notesMutation.mutate({ id: app._id, notes: notesDraft })}
                              className="text-xs text-[#ef3e34] [font-family:'Montserrat',Helvetica] font-semibold"
                            >Save</button>
                            <button
                              onClick={() => setEditingNotes(null)}
                              className="text-xs text-[#9ca3af] [font-family:'Montserrat',Helvetica]"
                            >Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <span
                          className="[font-family:'Montserrat',Helvetica] text-xs text-[#374151] cursor-pointer hover:text-[#ef3e34] line-clamp-2"
                          onClick={() => { setEditingNotes(app._id); setNotesDraft(app.notes || ""); }}
                        >
                          {app.notes || <span className="text-[#d1d5db]">Add note...</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => router.push(`/applications/${app._id}`)}
                        className="[font-family:'Montserrat',Helvetica] text-xs text-[#ef3e34] hover:underline font-semibold"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
