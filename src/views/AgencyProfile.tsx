"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { SettingsSectionCard } from "@/components/settings/SettingsPrimitives";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// ── Constants ──────────────────────────────────────────────────────────────

const AGENCY_TYPE_OPTIONS = [
  { value: "police", label: "Police" },
  { value: "fire", label: "Fire" },
  { value: "ems", label: "EMS" },
  { value: "school", label: "School" },
  { value: "healthcare", label: "Healthcare" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "municipality", label: "Municipality" },
  { value: "other", label: "Other" },
];

const PROGRAM_AREA_OPTIONS = [
  { value: "equipment", label: "Equipment" },
  { value: "safety", label: "Safety" },
  { value: "communications", label: "Communications" },
  { value: "training", label: "Training" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "technology", label: "Technology" },
  { value: "community_outreach", label: "Community Outreach" },
  { value: "other", label: "Other" },
];

const BUDGET_OPTIONS = [
  { value: "under_25k", label: "Under $25K" },
  { value: "25k_50k", label: "$25K\u2013$50K" },
  { value: "50k_100k", label: "$50K\u2013$100K" },
  { value: "100k_plus", label: "$100K+" },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "ASAP" },
  { value: "3_6_months", label: "3\u20136 months" },
  { value: "6_12_months", label: "6\u201312 months" },
];

// ── Types ──────────────────────────────────────────────────────────────────

type Org = {
  _id: string;
  name?: string;
  location?: string;
  websiteUrl?: string;
  missionStatement?: string;
  agencyTypes?: string[];
  programAreas?: string[];
  focusAreas?: string[];
  budgetRange?: string;
  timeline?: string;
  goals?: string[];
  populationServed?: number;
  coverageArea?: string;
  numberOfStaff?: number;
  currentEquipment?: string;
  canMeetLocalMatch?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiSettings = {
  organizationId?: { _id?: string } | string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function row(label: string, value?: React.ReactNode) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[#f0f0f0] bg-white px-4 py-3">
      <dt className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
        {label}
      </dt>
      <dd className="[font-family:'Montserrat',Helvetica] text-sm text-[#111827]">{value ?? "\u2014"}</dd>
    </div>
  );
}

function listOrDash(arr?: string[]) {
  if (!arr || arr.length === 0) return "\u2014";
  return arr.join(", ");
}

function budgetLabel(v?: string) {
  if (!v) return "\u2014";
  const map: Record<string, string> = {
    under_25k: "Under $25K",
    "25k_50k": "$25K\u2013$50K",
    "50k_100k": "$50K\u2013$100K",
    "100k_plus": "$100K+",
    // legacy
    "25k_150k": "$25K \u2013 $150K",
    "150k_500k": "$150K \u2013 $500K",
    "500k_plus": "$500K+",
  };
  return map[v] ?? v;
}

function timelineLabel(v?: string) {
  if (!v) return "\u2014";
  const map: Record<string, string> = {
    asap: "ASAP",
    "3_6_months": "3\u20136 months",
    "6_12_months": "6\u201312 months",
    urgent: "Urgent",
    planned: "Planned",
    any: "Any",
  };
  return map[v] ?? v;
}

const inputCls =
  "w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20";
const labelCls =
  "[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]";
const helperCls =
  "[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280] leading-4 mt-0.5";

// ── Component ──────────────────────────────────────────────────────────────

export function AgencyProfile() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: settings } = useQuery<ApiSettings>({
    queryKey: qk.settings(),
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data.data as ApiSettings;
    },
  });

  const orgId = useMemo(() => {
    const v = settings?.organizationId;
    if (!v) return "";
    if (typeof v === "string") return v;
    return v._id ?? "";
  }, [settings?.organizationId]);

  const { data: org, isLoading, isError } = useQuery<Org>({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      const res = await api.get(`/organizations/${orgId}`);
      return res.data.data as Org;
    },
    enabled: Boolean(orgId),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    websiteUrl: "",
    missionStatement: "",
    agencyType: "",
    programAreas: [] as string[],
    budgetRange: "under_25k",
    timeline: "asap",
    goalsCsv: "",
    populationServed: "",
    coverageArea: "",
    numberOfStaff: "",
    currentEquipment: "",
  });

  useEffect(() => {
    if (!org) return;
    setForm({
      name: org.name ?? "",
      location: org.location ?? "",
      websiteUrl: org.websiteUrl ?? "",
      missionStatement: org.missionStatement ?? "",
      agencyType: (org.agencyTypes ?? [])[0] ?? "",
      programAreas: org.programAreas ?? [],
      budgetRange: (org.budgetRange as string) ?? "under_25k",
      timeline: (org.timeline as string) ?? "asap",
      goalsCsv: (org.goals ?? []).join(", "),
      populationServed: org.populationServed != null ? String(org.populationServed) : "",
      coverageArea: org.coverageArea ?? "",
      numberOfStaff: org.numberOfStaff != null ? String(org.numberOfStaff) : "",
      currentEquipment: org.currentEquipment ?? "",
    });
  }, [org]);

  const toggleProgramArea = (value: string) => {
    setForm((f) => ({
      ...f,
      programAreas: f.programAreas.includes(value)
        ? f.programAreas.filter((v) => v !== value)
        : [...f.programAreas, value],
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: form.name.trim() || undefined,
        location: form.location.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        missionStatement: form.missionStatement.trim() || undefined,
        agencyTypes: form.agencyType ? [form.agencyType] : [],
        programAreas: form.programAreas,
        budgetRange: form.budgetRange,
        timeline: form.timeline,
        goals: form.goalsCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        coverageArea: form.coverageArea.trim() || undefined,
        currentEquipment: form.currentEquipment.trim() || undefined,
      };
      const pop = form.populationServed.trim();
      const staff = form.numberOfStaff.trim();
      if (pop) body.populationServed = Number(pop);
      if (staff) body.numberOfStaff = Number(staff);
      const res = await api.put(`/organizations/${orgId}`, body);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["organization", orgId] });
      await qc.invalidateQueries({ queryKey: qk.settings() });
      toast({ title: "Agency profile saved" });
      setEditing(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save profile.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            className="-ml-3 h-auto w-fit gap-2 px-3 py-2 text-[#374151] hover:text-[#111827]"
            asChild
          >
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
              Back to settings
            </Link>
          </Button>
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl sm:text-3xl tracking-[0.5px] uppercase leading-tight">
            Agency Profile
          </h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm">
            Review the agency details you provided during onboarding.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="border-[#e5e7eb] bg-white"
                onClick={() => setEditing(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#ef3e34] hover:bg-[#d63530]"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !orgId}
              >
                {saveMutation.isPending ? "Saving\u2026" : "Save changes"}
              </Button>
            </>
          ) : (
            <Button type="button" className="bg-[#ef3e34] hover:bg-[#d63530]" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#6b7280] [font-family:'Montserrat',Helvetica]">Loading\u2026</p>}
      {isError && (
        <p className="text-sm text-red-600 [font-family:'Montserrat',Helvetica]">
          Could not load your agency profile.
        </p>
      )}

      {!isLoading && !isError && org && (
        <div className="flex flex-col gap-6">

          {/* ── Overview ── */}
          <SettingsSectionCard
            icon={<span className="[font-family:'Montserrat',Helvetica] font-bold text-[#ef3e34] text-xs">A</span>}
            title="Overview"
            subtitle="Basic agency information"
          >
            {editing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Agency name</label>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Location</label>
                  <input
                    className={inputCls}
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className={labelCls}>Website URL</label>
                  <input
                    className={inputCls}
                    placeholder="https://"
                    value={form.websiteUrl}
                    onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className={labelCls}>Mission statement</label>
                  <textarea
                    rows={4}
                    className={`${inputCls} resize-none`}
                    value={form.missionStatement}
                    onChange={(e) => setForm((f) => ({ ...f, missionStatement: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                    Local match capacity is edited in{" "}
                    <Link href="/settings" className="font-medium text-[#ef3e34] hover:underline">
                      Settings
                    </Link>
                    .
                  </p>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {row("Agency name", org.name)}
                {row("Location", org.location)}
                {row(
                  "Website",
                  org.websiteUrl ? (
                    <a
                      className="text-[#ef3e34] hover:underline break-all"
                      href={org.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {org.websiteUrl}
                    </a>
                  ) : (
                    "\u2014"
                  )
                )}
                <div className="sm:col-span-2">{row("Mission statement", org.missionStatement)}</div>
              </dl>
            )}
          </SettingsSectionCard>

          {/* ── Matching inputs ── */}
          <SettingsSectionCard
            icon={<span className="[font-family:'Montserrat',Helvetica] font-bold text-[#ef3e34] text-xs">M</span>}
            title="Matching inputs"
            subtitle="Used to compute fit scores and recommendations"
          >
            {editing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Agency Type — single dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Agency type</label>
                  <select
                    className={`${inputCls} appearance-none cursor-pointer`}
                    value={form.agencyType}
                    onChange={(e) => setForm((f) => ({ ...f, agencyType: e.target.value }))}
                  >
                    <option value="">Select type\u2026</option>
                    {AGENCY_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amount Requested — dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Amount Requested</label>
                  <select
                    className={`${inputCls} appearance-none cursor-pointer`}
                    value={form.budgetRange}
                    onChange={(e) => setForm((f) => ({ ...f, budgetRange: e.target.value }))}
                  >
                    {BUDGET_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Timeline — dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Timeline</label>
                  <select
                    className={`${inputCls} appearance-none cursor-pointer`}
                    value={form.timeline}
                    onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                  >
                    {TIMELINE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Program Areas — multi-select checkboxes */}
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className={labelCls}>Program areas</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PROGRAM_AREA_OPTIONS.map((o) => (
                      <label
                        key={o.value}
                        className="flex items-center gap-2 cursor-pointer [font-family:'Montserrat',Helvetica] text-sm text-[#111827]"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#e5e7eb] accent-[#ef3e34]"
                          checked={form.programAreas.includes(o.value)}
                          onChange={() => toggleProgramArea(o.value)}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className={labelCls}>Goals (comma separated)</label>
                  <input
                    className={inputCls}
                    value={form.goalsCsv}
                    onChange={(e) => setForm((f) => ({ ...f, goalsCsv: e.target.value }))}
                  />
                  <p className={helperCls}>
                    Goals help us match you with funders whose priorities align with your organization&apos;s strategic objectives.
                  </p>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {row("Agency type", listOrDash(org.agencyTypes))}
                {row("Program areas", listOrDash(org.programAreas))}
                {row("Amount Requested", budgetLabel(org.budgetRange))}
                {row("Timeline", timelineLabel(org.timeline))}
                <div className="sm:col-span-2">{row("Goals", listOrDash(org.goals))}</div>
              </dl>
            )}
          </SettingsSectionCard>

          {/* ── Agency details ── */}
          <SettingsSectionCard
            icon={<span className="[font-family:'Montserrat',Helvetica] font-bold text-[#ef3e34] text-xs">D</span>}
            title="Agency details"
            subtitle="Optional context from onboarding"
          >
            {editing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Population served</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.populationServed}
                    onChange={(e) => setForm((f) => ({ ...f, populationServed: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Number of staff</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={form.numberOfStaff}
                    onChange={(e) => setForm((f) => ({ ...f, numberOfStaff: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className={labelCls}>Coverage Area in Miles</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 50"
                    value={form.coverageArea}
                    onChange={(e) => setForm((f) => ({ ...f, coverageArea: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className={labelCls}>Current equipment</label>
                  <textarea
                    rows={3}
                    className={`${inputCls} resize-none`}
                    value={form.currentEquipment}
                    onChange={(e) => setForm((f) => ({ ...f, currentEquipment: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {row("Population served", org.populationServed != null ? org.populationServed.toLocaleString() : "\u2014")}
                {row("Coverage Area in Miles", org.coverageArea)}
                {row("Number of staff", org.numberOfStaff != null ? org.numberOfStaff.toLocaleString() : "\u2014")}
                <div className="sm:col-span-2">{row("Current equipment", org.currentEquipment)}</div>
              </dl>
            )}
          </SettingsSectionCard>

        </div>
      )}
    </div>
  );
}
