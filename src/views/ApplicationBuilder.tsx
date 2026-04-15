"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, RefreshCw, CheckCircle, Columns2, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Application {
  _id: string;
  projectTitle?: string;
  status: string;
  problemStatement?: string;
  communityImpact?: string;
  proposedSolution?: string;
  measurableOutcomes?: string;
  urgency?: string;
  budgetSummary?: string;
  alignedVersion?: {
    problemStatement?: string;
    communityImpact?: string;
    proposedSolution?: string;
    measurableOutcomes?: string;
    urgency?: string;
    budgetSummary?: string;
    generatedAt?: string;
  };
  notes?: string;
  dateSubmitted?: string;
  funder?: { _id: string; name: string; avgGrantMax?: number; deadline?: string };
  opportunity?: { title: string; funder: string; maxAmount?: number; deadline?: string };
  organization?: { name: string };
}

const SECTIONS = [
  { key: "problemStatement", label: "Problem Statement" },
  { key: "communityImpact", label: "Community Impact" },
  { key: "proposedSolution", label: "Proposed Solution" },
  { key: "measurableOutcomes", label: "Measurable Outcomes" },
  { key: "urgency", label: "Urgency" },
  { key: "budgetSummary", label: "Budget Summary" },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];
type ViewMode = "original" | "aligned" | "compare";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  drafting: "bg-blue-100 text-blue-700",
  ready_to_submit: "bg-purple-100 text-purple-700",
  submitted: "bg-orange-100 text-orange-700",
  in_review: "bg-yellow-100 text-yellow-700",
  under_review: "bg-yellow-100 text-yellow-700",
  "under-review": "bg-yellow-100 text-yellow-700",
  awarded: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
  declined: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

// Statuses set by Red Dog staff — agency cannot change these
const ADMIN_CONTROLLED_STATUSES = ["under_review", "under-review", "in_review", "awarded", "declined", "denied", "rejected", "approved"];

const EmptyContent = () => (
  <span className="text-[#9ca3af] italic text-sm [font-family:'Montserrat',Helvetica]">
    No content yet. Click ↺ Regenerate to generate with AI.
  </span>
);

export const ApplicationBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [form, setForm] = useState<Partial<Application>>({});
  const [editNotes, setEditNotes] = useState("");
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const { data: app, isLoading, isError, refetch } = useQuery<Application>({
    queryKey: qk.application(id),
    queryFn: async () => {
      const res = await api.get(`/applications/${id}`);
      return res.data.data as Application;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (app) {
      setForm(app);
      setEditNotes(app.notes || "");
    }
  }, [app]);

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/applications/${id}`, { ...form, notes: editNotes }),
    onSuccess: () => {
      toast({ title: "Application saved" });
      queryClient.invalidateQueries({ queryKey: qk.application(id) });
      queryClient.invalidateQueries({ queryKey: qk.applications() });
      setIsEditing(false);
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`/applications/${id}/regenerate`),
    onSuccess: () => {
      toast({ title: "✓ Content regenerated", description: "All sections have been rewritten with fresh AI content." });
      queryClient.invalidateQueries({ queryKey: qk.application(id) });
      setViewMode("original");
      setShowRegenerateConfirm(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to regenerate.", variant: "destructive" });
      setShowRegenerateConfirm(false);
    },
  });

  const alignMutation = useMutation({
    mutationFn: () => api.post(`/applications/${id}/align`),
    onSuccess: () => {
      toast({
        title: "✓ Aligned to funder language",
        description: "A funder-specific rewrite is now available. Compare both versions below.",
      });
      queryClient.invalidateQueries({ queryKey: qk.application(id) });
      setViewMode("compare");
    },
    onError: () => toast({ title: "Error", description: "Failed to align.", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/applications/${id}/status`, { status }),
    onSuccess: (_, status) => {
      toast({ title: `Status updated to ${status.replace(/_/g, " ")}` });
      queryClient.invalidateQueries({ queryKey: qk.application(id) });
      queryClient.invalidateQueries({ queryKey: qk.applications() });
    },
  });

  const handleExport = async () => {
    try {
      const res = await api.get(`/applications/${id}/export`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `application-${id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-6 bg-neutral-50 p-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-white border border-[#e5e7eb]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 bg-neutral-50 gap-3">
        <p className="[font-family:'Montserrat',Helvetica] text-red-600 text-base">Failed to load application. Please try again.</p>
        <button onClick={() => refetch()} className="rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d63029]">
          Retry
        </button>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex w-full items-center justify-center py-20 bg-neutral-50">
        <p className="[font-family:'Montserrat',Helvetica] text-[#6b7280]">Application not found.</p>
      </div>
    );
  }

  const funderName = app.funder?.name || app.opportunity?.funder || "Unknown Funder";
  const statusColor = STATUS_COLORS[app.status] || "bg-gray-100 text-gray-700";
  const hasAligned = !!app.alignedVersion;
  const isAdminControlled = ADMIN_CONTROLLED_STATUSES.includes(app.status);

  const appRecord = app as unknown as Record<string, unknown>;
  const alignedRecord = app.alignedVersion as unknown as Record<string, unknown> | undefined;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#6b7280] hover:text-[#111827] transition-colors w-fit [font-family:'Montserrat',Helvetica] text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl sm:text-3xl tracking-[0.5px] uppercase">
            {app.projectTitle || "Application"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">Funder: {funderName}</span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold [font-family:'Montserrat',Helvetica] ${statusColor}`}>
              {app.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
            {isAdminControlled && (
              <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] italic">
                — set by Red Dog staff
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] text-[#374151] hover:bg-[#f9fafb]"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={regenerateMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
          >
            <RefreshCw size={14} className={regenerateMutation.isPending ? "animate-spin" : ""} />
            {regenerateMutation.isPending ? "Regenerating..." : "↺ Regenerate"}
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold [font-family:'Montserrat',Helvetica] text-[#374151] hover:bg-[#f9fafb]"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-bold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029] disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save Draft"}
            </button>
          )}
        </div>
      </div>

      {/* Regenerate Confirm Banner */}
      {showRegenerateConfirm && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <AlertTriangle size={18} className="shrink-0 text-orange-500 mt-0.5" />
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <p className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-orange-800">
              Regenerate all sections with fresh AI content?
            </p>
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-orange-700">
              This will replace your current content in all sections. Any manual edits will be overwritten.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-60 [font-family:'Montserrat',Helvetica]"
              >
                {regenerateMutation.isPending ? "Regenerating..." : "Yes, Regenerate"}
              </button>
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="rounded-lg border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 [font-family:'Montserrat',Helvetica]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Switcher (only when aligned version exists) */}
      {hasAligned && (
        <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827]">
              Funder-aligned version available
            </span>
            <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
              Compare original AI content against a rewrite tailored to this funder's language and priorities.
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-1">
            <button
              onClick={() => setViewMode("original")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold [font-family:'Montserrat',Helvetica] transition-all",
                viewMode === "original"
                  ? "bg-white shadow text-[#111827]"
                  : "text-[#6b7280] hover:text-[#374151]"
              )}
            >
              <FileText size={12} /> Original
            </button>
            <button
              onClick={() => setViewMode("aligned")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold [font-family:'Montserrat',Helvetica] transition-all",
                viewMode === "aligned"
                  ? "bg-[#ef3e34] shadow text-white"
                  : "text-[#6b7280] hover:text-[#374151]"
              )}
            >
              <CheckCircle size={12} /> Aligned
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold [font-family:'Montserrat',Helvetica] transition-all",
                viewMode === "compare"
                  ? "bg-white shadow text-[#111827]"
                  : "text-[#6b7280] hover:text-[#374151]"
              )}
            >
              <Columns2 size={12} /> Compare
            </button>
          </div>
        </div>
      )}

      {/* Compare Mode Banner */}
      {viewMode === "compare" && hasAligned && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2 text-center">
            <span className="[font-family:'Montserrat',Helvetica] text-xs font-bold text-[#6b7280] uppercase tracking-wide">
              Original Content
            </span>
          </div>
          <div className="rounded-lg border border-[#ef3e3433] bg-[#fff8f8] px-4 py-2 text-center">
            <span className="[font-family:'Montserrat',Helvetica] text-xs font-bold text-[#ef3e34] uppercase tracking-wide">
              ✦ Aligned — Funder Language
            </span>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {SECTIONS.map(({ key, label }) => {
          const originalContent = appRecord[key] as string | undefined;
          const alignedContent = alignedRecord?.[key] as string | undefined;
          const displayContent = viewMode === "aligned" && alignedContent ? alignedContent : originalContent;

          if (viewMode === "compare" && hasAligned) {
            return (
              <div key={key} className="grid grid-cols-2 gap-4">
                {/* Original */}
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 flex flex-col gap-3">
                  <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm uppercase tracking-wide">
                    {label}
                  </h3>
                  {isEditing ? (
                    <textarea
                      className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] text-[#111827] focus:border-[#ef3e34] focus:outline-none min-h-[100px]"
                      value={(form as unknown as Record<string, string>)[key] || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  ) : originalContent ? (
                    <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                      {originalContent}
                    </p>
                  ) : (
                    <EmptyContent />
                  )}
                </div>
                {/* Aligned */}
                <div className="rounded-xl border border-[#ef3e3420] bg-[#fff8f8] p-5 flex flex-col gap-3">
                  <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#ef3e34] text-sm uppercase tracking-wide flex items-center gap-2">
                    {label}
                    <span className="rounded-full bg-[#ef3e341a] border border-[#ef3e3433] px-2 py-0.5 text-[10px] text-[#ef3e34] normal-case tracking-normal font-semibold">
                      Aligned
                    </span>
                  </h3>
                  {alignedContent ? (
                    <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                      {alignedContent}
                    </p>
                  ) : (
                    <span className="text-[#9ca3af] italic text-sm [font-family:'Montserrat',Helvetica]">
                      No aligned version for this section.
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={key} className={cn(
              "rounded-xl border p-5 flex flex-col gap-3",
              viewMode === "aligned" && alignedContent
                ? "border-[#ef3e3420] bg-[#fff8f8]"
                : "border-[#e5e7eb] bg-white"
            )}>
              <h3 className={cn(
                "[font-family:'Montserrat',Helvetica] font-bold text-sm uppercase tracking-wide flex items-center gap-2",
                viewMode === "aligned" && alignedContent ? "text-[#ef3e34]" : "text-[#111827]"
              )}>
                {label}
                {viewMode === "aligned" && alignedContent && (
                  <span className="rounded-full bg-[#ef3e341a] border border-[#ef3e3433] px-2 py-0.5 text-[10px] text-[#ef3e34] normal-case tracking-normal font-semibold">
                    Aligned ✦
                  </span>
                )}
              </h3>
              {isEditing && viewMode !== "aligned" ? (
                <textarea
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] text-[#111827] focus:border-[#ef3e34] focus:outline-none min-h-[100px]"
                  value={(form as unknown as Record<string, string>)[key] || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              ) : displayContent ? (
                <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {displayContent}
                </p>
              ) : (
                <EmptyContent />
              )}
            </div>
          );
        })}

        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 flex flex-col gap-3">
          <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm uppercase tracking-wide">Notes</h3>
          {isEditing ? (
            <textarea
              className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] text-[#111827] focus:border-[#ef3e34] focus:outline-none"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Internal notes..."
            />
          ) : (
            <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{app.notes || "No notes."}</p>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap gap-3 border-t border-[#e5e7eb] pt-4">
        <button
          onClick={() => alignMutation.mutate()}
          disabled={alignMutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-[#ef3e34] bg-white px-4 py-2.5 text-sm font-semibold [font-family:'Montserrat',Helvetica] text-[#ef3e34] hover:bg-[#fef2f2] disabled:opacity-50 transition-colors"
        >
          {alignMutation.isPending ? (
            <><RefreshCw size={14} className="animate-spin" /> Aligning to Funder…</>
          ) : (
            <><CheckCircle size={14} /> Align to Funder Language</>
          )}
        </button>
        {!isAdminControlled && app.status !== "submitted" && (
          <button
            onClick={() => statusMutation.mutate("submitted")}
            disabled={statusMutation.isPending}
            className="rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-bold text-white [font-family:'Montserrat',Helvetica] hover:bg-green-600 disabled:opacity-50"
          >
            Mark as Submitted
          </button>
        )}
      </div>

      {/* Aligned version timestamp */}
      {app.alignedVersion?.generatedAt && (
        <p className="text-xs text-[#9ca3af] [font-family:'Montserrat',Helvetica]">
          Aligned version generated: {new Date(app.alignedVersion.generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};
