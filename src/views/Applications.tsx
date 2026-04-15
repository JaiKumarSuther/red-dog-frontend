"use client";

import type { ElementType } from "react";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FileText, Award, Clock, Eye, Pencil, CalendarClock, ChevronDown, Check, RefreshCw } from "lucide-react";
import { MobileFilterSelect } from "@/components/MobileFilterSelect";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";

type AppItem = {
  id: string;
  grant: string;
  funder: string;
  amount: string;
  org: string;
  appliedDate: string;
  category: string;
  status: string;
  ashleenMsg: string;
};

type ApiFunderRef = string | { _id?: string; name?: string; avgGrantMax?: number; deadline?: string } | null;

type ApiApp = {
  _id: string;
  projectTitle?: string;
  title?: string;
  grant?: string;
  opportunity?: { title?: string; funder?: string; maxAmount?: number; category?: string };
  funder?: ApiFunderRef;
  amount?: number;
  amountRequested?: number;
  organization?: { name?: string };
  orgName?: string;
  submittedAt?: string;
  appliedDate?: string;
  createdAt?: string;
  category?: string;
  status?: string;
  notes?: string;
};

const ashleenMsgFor = (status: string): string => {
  switch (status) {
    case "under-review":
    case "in_review":
      return "We're in the running! This funder typically takes 8-12 weeks to review. I'll alert you the moment there's news.";
    case "awarded":
      return "Congratulations! This is a well-deserved win. Your narrative around community impact was exactly what the funder was looking for. Let's use this momentum for the next application!";
    case "submitted":
      return "Application submitted successfully! I'll monitor for any updates from the funder and keep you informed.";
    case "drafting":
      return "I've started drafting this application based on your organization profile. Review and let me know if you'd like any changes.";
    case "declined":
      return "This one didn't go through, but don't worry — I've analyzed the feedback and found similar grants opening next quarter that are a stronger fit.";
    case "rejected":
      return "This application was rejected. I’ve captured the staff notes so we can adjust and improve for the next submission.";
    default:
      return "I'm monitoring this application and will alert you to any developments.";
  }
};

const fmtDate = (s: string | undefined) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return s;
  }
};

const fmtAmount = (n: number | undefined) => {
  if (!n) return "—";
  return n >= 1000 ? `$${(n / 1000).toFixed(0)},000` : `$${n}`;
};

const resolveFunderName = (f: ApiFunderRef): string => {
  if (!f) return "—";
  if (typeof f === "string") return f || "—";
  return f.name || "—";
};

const mapApp = (a: ApiApp): AppItem => ({
  id: a._id,
  grant: a.projectTitle ?? a.opportunity?.title ?? a.title ?? a.grant ?? "Unknown Grant",
  funder: a.opportunity?.funder ?? resolveFunderName(a.funder ?? null),
  amount: a.amountRequested ? fmtAmount(a.amountRequested) : (a.amount ? fmtAmount(a.amount) : (a.opportunity?.maxAmount ? fmtAmount(a.opportunity.maxAmount) : "—")),
  org: a.orgName ?? a.organization?.name ?? "—",
  appliedDate: fmtDate(a.submittedAt ?? a.appliedDate ?? a.createdAt),
  category: a.opportunity?.category ?? a.category ?? "—",
  status: a.status ?? "submitted",
  ashleenMsg: a.notes ?? ashleenMsgFor(a.status ?? "submitted"),
});

const statusConfig: Record<string, {
  label: string;
  badgeCls: string;
  iconBg: string;
  Icon: ElementType;
  iconCls: string;
  msgBg: string;
}> = {
  "under-review": {
    label: "Under Review",
    badgeCls: "bg-[#fef9c3] text-[#b45309]",
    iconBg: "bg-[#fff7ed]",
    Icon: Clock,
    iconCls: "text-[#f59e0b]",
    msgBg: "bg-[#eff6ff] border-[#dbeafe]",
  },
  "in_review": {
    label: "Under Review",
    badgeCls: "bg-[#fef9c3] text-[#b45309]",
    iconBg: "bg-[#fff7ed]",
    Icon: Clock,
    iconCls: "text-[#f59e0b]",
    msgBg: "bg-[#eff6ff] border-[#dbeafe]",
  },
  "awarded": {
    label: "Awarded",
    badgeCls: "bg-[#dcfce7] text-[#16a34a]",
    iconBg: "bg-[#f0fdf4]",
    Icon: Award,
    iconCls: "text-[#16a34a]",
    msgBg: "bg-[#f0fdf4] border-[#bbf7d0]",
  },
  "submitted": {
    label: "Submitted",
    badgeCls: "bg-[#dbeafe] text-[#1d4ed8]",
    iconBg: "bg-[#eff6ff]",
    Icon: FileText,
    iconCls: "text-[#3b82f6]",
    msgBg: "bg-[#f8fafc] border-[#e2e8f0]",
  },
  "drafting": {
    label: "Drafting",
    badgeCls: "bg-[#f3f4f6] text-[#6b7280]",
    iconBg: "bg-[#f3f4f6]",
    Icon: Pencil,
    iconCls: "text-[#9ca3af]",
    msgBg: "bg-[#f8fafc] border-[#e2e8f0]",
  },
  "declined": {
    label: "Declined",
    badgeCls: "bg-[#fee2e2] text-[#dc2626]",
    iconBg: "bg-[#fff1f0]",
    Icon: CalendarClock,
    iconCls: "text-[#ef4444]",
    msgBg: "bg-[#fff1f0] border-[#fecaca]",
  },
  "rejected": {
    label: "Rejected",
    badgeCls: "bg-[#fee2e2] text-[#dc2626]",
    iconBg: "bg-[#fff1f0]",
    Icon: CalendarClock,
    iconCls: "text-[#ef4444]",
    msgBg: "bg-[#fff1f0] border-[#fecaca]",
  },
};

const defaultCfg = {
  label: "Submitted",
  badgeCls: "bg-[#dbeafe] text-[#1d4ed8]",
  iconBg: "bg-[#eff6ff]",
  Icon: FileText,
  iconCls: "text-[#3b82f6]",
  msgBg: "bg-[#f8fafc] border-[#e2e8f0]",
};

const filterTabs: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Drafting", value: "drafting" },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under-review" },
  { label: "Awarded", value: "awarded" },
  { label: "Declined", value: "declined" },
  { label: "Rejected", value: "rejected" },
];

// Statuses an agency user may SET themselves
const AGENCY_STATUS_OPTIONS = [
  { value: "drafting", label: "Drafting" },
  { value: "ready_to_submit", label: "Ready to Submit" },
  { value: "submitted", label: "Submitted" },
  { value: "withdrawn", label: "Withdrawn" },
];

// Any status NOT in this list was set by an admin — show as read-only badge
const AGENCY_EDITABLE_STATUSES = ["drafting", "ready_to_submit", "submitted", "withdrawn"];

const AppCard = ({ app }: { app: AppItem }) => {
  const cfg = statusConfig[app.status] ?? defaultCfg;
  const isAgencyEditable = AGENCY_EDITABLE_STATUSES.includes(app.status);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    if (pickerOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      api.put(`/applications/${app.id}/status`, { status: newStatus }),
    onSuccess: (_, newStatus) => {
      const label = AGENCY_STATUS_OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus;
      toast({ title: "Status updated", description: `Application marked as "${label}".` });
      queryClient.invalidateQueries({ queryKey: qk.applications() });
      setPickerOpen(false);
    },
    onError: () => {
      toast({ title: "Update failed", description: "Could not update status. Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="bg-white rounded-xl border border-[#f0f0f0] shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <cfg.Icon size={20} className={cfg.iconCls} />
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#111827] text-sm sm:text-base leading-snug break-words">{app.grant}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs">{app.funder}</span>
              <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#111827] text-xs">{app.amount}</span>
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold flex-shrink-0 ${cfg.badgeCls}`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs [font-family:'Montserrat',Helvetica]">
        <span className="text-[#9ca3af]">Org: <span className="text-[#374151] font-medium">{app.org}</span></span>
        <span className="text-[#9ca3af]">Category: <span className="text-[#374151] font-medium">{app.category}</span></span>
        <span className="text-[#9ca3af]">Applied: <span className="text-[#374151] font-medium">{app.appliedDate}</span></span>
      </div>

      <div className={`flex items-start gap-2.5 rounded-xl border ${cfg.msgBg} px-3 py-2.5 sm:px-4 sm:py-3`}>
        <div className="w-6 h-6 rounded-full bg-[#ef3e34] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="[font-family:'Montserrat',Helvetica] font-bold text-white text-[10px]">A</span>
        </div>
        <p className="min-w-0 flex-1 [font-family:'Montserrat',Helvetica] font-normal text-[#374151] text-xs leading-5 pt-0.5 break-words">
          {app.ashleenMsg}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4 pt-1 border-t border-[#f3f4f6]">
        <button
          onClick={() => router.push(`/applications/${app.id}`)}
          className="flex items-center gap-1.5 [font-family:'Montserrat',Helvetica] font-medium text-xs text-[#6b7280] hover:text-[#374151] transition-colors"
        >
          <Eye size={14} />
          View
        </button>

        {isAgencyEditable ? (
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen((p) => !p)}
              disabled={statusMutation.isPending}
              className="flex items-center gap-1.5 [font-family:'Montserrat',Helvetica] font-medium text-xs text-[#ef3e34] hover:text-[#d63530] transition-colors disabled:opacity-50"
            >
              <Pencil size={13} />
              {statusMutation.isPending ? "Updating…" : "Update Status"}
              <ChevronDown size={12} className={`transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
            </button>
            {pickerOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl border border-[#e5e7eb] shadow-[0_4px_20px_rgba(0,0,0,0.12)] z-20 overflow-hidden">
                {AGENCY_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => statusMutation.mutate(opt.value)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left [font-family:'Montserrat',Helvetica] text-xs font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
                  >
                    {opt.label}
                    {app.status === opt.value && <Check size={13} className="text-[#ef3e34] flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] italic">
            Status set by Red Dog staff
          </span>
        )}
      </div>
    </div>
  );
};

export const Applications = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: rawApps = [], isLoading: loading, refetch, isFetching } = useQuery<AppItem[]>({
    queryKey: qk.applications(),
    queryFn: async () => {
      const res = await api.get("/applications", { params: { limit: 100 } });
      const raw: ApiApp[] = res.data.data ?? [];
      return raw.map(mapApp);
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const apps = rawApps;

  const filtered = apps.filter(
    (a) => activeFilter === "all" || a.status === activeFilter || (activeFilter === "under-review" && a.status === "in_review")
  );

  const totalApplied = apps.filter((a) => ["submitted", "in_review", "under-review", "awarded"].includes(a.status)).length;
  const awarded = apps.filter((a) => a.status === "awarded").length;
  const underReview = apps.filter((a) => a.status === "in_review" || a.status === "under-review").length;

  const stats = [
    { label: "Total Applied", value: totalApplied, Icon: FileText, iconBg: "bg-[#eff6ff]", iconCls: "text-[#3b82f6]", valueCls: "text-[#3b82f6]" },
    { label: "Awarded", value: awarded, Icon: Award, iconBg: "bg-[#f0fdf4]", iconCls: "text-[#16a34a]", valueCls: "text-[#16a34a]" },
    { label: "Under Review", value: underReview, Icon: Clock, iconBg: "bg-[#fff7ed]", iconCls: "text-[#f59e0b]", valueCls: "text-[#f59e0b]" },
  ];

  return (
    <div className="flex h-full min-w-0 flex-col gap-5 bg-neutral-50 p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl min-[400px]:text-3xl tracking-[0.5px] uppercase leading-tight break-words">
            Applications
          </h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm max-w-prose break-words">
            Track all grant applications and outcomes
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#6b7280] hover:border-[#ef3e34]/40 hover:text-[#ef3e34] transition-colors disabled:opacity-50"
          title="Refresh applications"
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#f0f0f0] shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-4 sm:p-5 flex min-w-0 items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
              <s.Icon size={20} className={s.iconCls} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={`[font-family:'Oswald',Helvetica] font-bold text-xl tabular-nums sm:text-2xl leading-tight ${s.valueCls}`}>
                {loading ? "—" : s.value}
              </span>
              <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs leading-snug break-words">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="min-w-0 flex-1 md:flex-initial">
          <MobileFilterSelect
            ariaLabel="Filter applications by status"
            label="Status"
            value={activeFilter}
            onChange={setActiveFilter}
            options={filterTabs.map((t) => ({ value: t.value, label: t.label }))}
            dataTestId="select-filter-applications"
          />
          <div className="hidden flex-wrap items-center gap-1.5 md:flex">
            {filterTabs.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setActiveFilter(t.value)}
                data-testid={`tab-${t.value}`}
                className={`h-8 rounded-lg px-4 [font-family:'Montserrat',Helvetica] text-sm font-semibold transition-all ${
                  activeFilter === t.value
                    ? "bg-[#ef3e34] text-white"
                    : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#ef3e34]/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <span className="[font-family:'Montserrat',Helvetica] text-sm font-normal text-[#9ca3af] md:flex-shrink-0 md:text-right">
          {loading ? "..." : `${filtered.length} results`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">Loading applications...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">No applications found</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
