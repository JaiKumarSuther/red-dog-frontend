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

const PRESET_AGENCY_TYPES = [
  "law_enforcement",
  "fire_services",
  "911_centers",
  "emergency_management",
  "ems",
  "hospitals",
  "public_safety_comms",
  "multi_agency",
  "utilities",
  "business",
] as const;

const PRESET_PROGRAM_AREAS = [
  "comms",
  "vehicles",
  "tech",
  "facilities",
  "ppe",
  "medical",
  "broadband",
  "community",
  "training",
  "cybersecurity",
] as const;

const PRESET_GOALS = ["discover", "track", "ai-write", "ai-score"] as const;

function row(label: string, value?: React.ReactNode) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[#f0f0f0] bg-white px-4 py-3">
      <dt className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
        {label}
      </dt>
      <dd className="[font-family:'Montserrat',Helvetica] text-sm text-[#111827]">{value ?? "—"}</dd>
    </div>
  );
}

function listOrDash(arr?: string[]) {
  if (!arr || arr.length === 0) return "—";
  return arr.join(", ");
}

function budgetLabel(v?: string) {
  if (!v) return "—";
  const map: Record<string, string> = {
    under_25k: "Under $25K",
    "25k_150k": "$25K – $150K",
    "150k_500k": "$150K – $500K",
    "500k_plus": "$500K+",
    "under-25k": "Under $25K",
    "25k-100k": "$25K – $150K",
    "100k-500k": "$100K – $500K",
    "500k-plus": "$500K+",
  };
  return map[v] ?? v;
}

function timelineLabel(v?: string) {
  if (!v) return "—";
  const map: Record<string, string> = { urgent: "Urgent", planned: "Planned", any: "Any" };
  return map[v] ?? v;
}

function parseCsv(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

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
    agencyTypesCsv: "",
    programAreasCsv: "",
    budgetRange: "under_25k",
    timeline: "planned",
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
      agencyTypesCsv: (org.agencyTypes ?? []).join(", "),
      programAreasCsv: (org.programAreas ?? []).join(", "),
      budgetRange: (org.budgetRange as string) ?? "under_25k",
      timeline: (org.timeline as string) ?? "planned",
      goalsCsv: (org.goals ?? []).join(", "),
      populationServed: org.populationServed != null ? String(org.populationServed) : "",
      coverageArea: org.coverageArea ?? "",
      numberOfStaff: org.numberOfStaff != null ? String(org.numberOfStaff) : "",
      currentEquipment: org.currentEquipment ?? "",
    });
  }, [org]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: form.name.trim() || undefined,
        location: form.location.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        missionStatement: form.missionStatement.trim() || undefined,
        agencyTypes: parseCsv(form.agencyTypesCsv),
        programAreas: parseCsv(form.programAreasCsv),
        budgetRange: form.budgetRange,
        timeline: form.timeline,
        goals: parseCsv(form.goalsCsv),
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
                {saveMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </>
          ) : (
            <Button type="button" className="bg-[#ef3e34] hover:bg-[#d63530]" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#6b7280] [font-family:'Montserrat',Helvetica]">Loading…</p>}
      {isError && (
        <p className="text-sm text-red-600 [font-family:'Montserrat',Helvetica]">
          Could not load your agency profile.
        </p>
      )}

      {!isLoading && !isError && org && (
        <div className="flex flex-col gap-6">
          <SettingsSectionCard
            icon={<span className="[font-family:'Montserrat',Helvetica] font-bold text-[#ef3e34] text-xs">A</span>}
            title="Overview"
            subtitle="Basic agency information"
          >
            {editing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Agency name
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Location
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Website URL
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    placeholder="https://"
                    value={form.websiteUrl}
                    onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Mission statement
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
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
                    "—"
                  )
                )}
                {row(
                  "Local match capacity",
                  org.canMeetLocalMatch == null ? "Not specified" : org.canMeetLocalMatch ? "Yes" : "No",
                )}
                <div className="sm:col-span-2">{row("Mission statement", org.missionStatement)}</div>
              </dl>
            )}
          </SettingsSectionCard>

          <SettingsSectionCard
            icon={<span className="[font-family:'Montserrat',Helvetica] font-bold text-[#ef3e34] text-xs">M</span>}
            title="Matching inputs"
            subtitle="Used to compute fit scores and recommendations"
          >
            {editing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Agency types (comma separated)
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.agencyTypesCsv}
                    onChange={(e) => setForm((f) => ({ ...f, agencyTypesCsv: e.target.value }))}
                  />
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">
                    Examples: {PRESET_AGENCY_TYPES.join(", ")}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Program areas (comma separated)
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.programAreasCsv}
                    onChange={(e) => setForm((f) => ({ ...f, programAreasCsv: e.target.value }))}
                  />
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">
                    Examples: {PRESET_PROGRAM_AREAS.join(", ")}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Budget range
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.budgetRange}
                    onChange={(e) => setForm((f) => ({ ...f, budgetRange: e.target.value }))}
                  >
                    <option value="under_25k">Under $25K</option>
                    <option value="25k_150k">$25K – $150K</option>
                    <option value="150k_500k">$150K – $500K</option>
                    <option value="500k_plus">$500K+</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Timeline
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.timeline}
                    onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Goals (comma separated)
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.goalsCsv}
                    onChange={(e) => setForm((f) => ({ ...f, goalsCsv: e.target.value }))}
                  />
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">
                    Examples: {PRESET_GOALS.join(", ")}
                  </p>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {row("Agency types", listOrDash(org.agencyTypes))}
                {row("Program areas", listOrDash(org.programAreas))}
                {row("Budget range", budgetLabel(org.budgetRange))}
                {row("Timeline", timelineLabel(org.timeline))}
                <div className="sm:col-span-2">{row("Goals", listOrDash(org.goals))}</div>
              </dl>
            )}
          </SettingsSectionCard>

          <SettingsSectionCard
            icon={<span className="[font-family:'Montserrat',Helvetica] font-bold text-[#ef3e34] text-xs">D</span>}
            title="Agency details"
            subtitle="Optional context from onboarding"
          >
            {editing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Population served
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.populationServed}
                    onChange={(e) => setForm((f) => ({ ...f, populationServed: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Number of staff
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.numberOfStaff}
                    onChange={(e) => setForm((f) => ({ ...f, numberOfStaff: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Coverage area
                  </label>
                  <input
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.coverageArea}
                    onChange={(e) => setForm((f) => ({ ...f, coverageArea: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                    Current equipment
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
                    value={form.currentEquipment}
                    onChange={(e) => setForm((f) => ({ ...f, currentEquipment: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {row("Population served", org.populationServed != null ? org.populationServed.toLocaleString() : "—")}
                {row("Coverage area", org.coverageArea)}
                {row("Number of staff", org.numberOfStaff != null ? org.numberOfStaff.toLocaleString() : "—")}
                <div className="sm:col-span-2">{row("Current equipment", org.currentEquipment)}</div>
              </dl>
            )}
          </SettingsSectionCard>
        </div>
      )}
    </div>
  );
}

