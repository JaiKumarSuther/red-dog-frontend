"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Globe, Mail, Phone, AlertCircle } from "lucide-react";

interface Funder {
  _id: string;
  name: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  missionStatement?: string;
  locationFocus?: string[];
  fundingCategories?: string[];
  agencyTypesFunded?: string[];
  equipmentTags?: string[];
  localMatchRequired?: boolean;
  avgGrantMin?: number;
  avgGrantMax?: number;
  deadline?: string;
  cyclesPerYear?: number;
  pastGrantsAwarded?: string[];
  notes?: string;
  matchScore?: number;
  matchTier?: string;
  matchReasons?: string[];
}

const fmt = (n?: number) => (n != null ? "$" + n.toLocaleString() : "—");

export const FunderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);

  const { data: funder, isLoading, isError, refetch } = useQuery<Funder>({
    queryKey: qk.funder(id),
    queryFn: async () => {
      const res = await api.get(`/funders/${id}`);
      const f = res.data.data as Funder;
      setNotes(f.notes || "");
      return f;
    },
    enabled: !!id,
  });

  type OppRow = { _id: string; funder: string; title: string; isLocked?: boolean };
  const { data: oppsForFunder } = useQuery({
    queryKey: ["opportunities-for-funder", funder?.name, id],
    queryFn: async () => {
      const res = await api.get("/opportunities", { params: { limit: 200 } });
      const rows = res.data.data as OppRow[];
      return rows.filter((o) => o.funder === funder?.name);
    },
    enabled: !!id && !!funder?.name,
  });

  const applyMutation = useMutation({
    mutationFn: (opportunityId?: string) => {
      const list = oppsForFunder ?? [];
      const body: { funderId: string; opportunityId?: string } = { funderId: id! };
      if (opportunityId) {
        body.opportunityId = opportunityId;
      } else if (list.length === 1) {
        body.opportunityId = list[0]._id;
      }
      return api.post("/applications/generate", body);
    },
    onSuccess: (res) => {
      toast({ title: "Application started", description: "AI is generating your application content." });
      queryClient.invalidateQueries({ queryKey: qk.applications() });
      router.push(`/applications/${res.data.data._id}`);
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 423) {
        toast({
          title: "Application limit reached",
          description: msg || "This opportunity has reached its application limit.",
          variant: "destructive",
        });
      } else if (status === 400) {
        toast({ title: "Choose from Matches or Opportunities", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg || "Failed to start application.", variant: "destructive" });
      }
    },
  });

  const outreachMutation = useMutation({
    mutationFn: () => api.post("/outreach/generate", { funderId: id }),
    onSuccess: (res) => {
      toast({ title: "Outreach email generated" });
      queryClient.invalidateQueries({ queryKey: qk.outreach() });
      router.push(`/outreach/${res.data.data._id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate outreach email.", variant: "destructive" });
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: () => api.put(`/funders/${id}`, { notes }),
    onSuccess: () => {
      toast({ title: "Notes saved" });
      queryClient.invalidateQueries({ queryKey: qk.funder(id) });
      setEditingNotes(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-6 bg-neutral-50 p-8">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-48 w-full animate-pulse rounded-xl bg-white border border-[#e5e7eb]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 bg-neutral-50 gap-3">
        <p className="[font-family:'Montserrat',Helvetica] text-red-600 text-base">Failed to load funder. Please try again.</p>
        <button onClick={() => refetch()} className="rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-semibold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029]">Retry</button>
      </div>
    );
  }

  if (!funder) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 bg-neutral-50">
        <p className="[font-family:'Montserrat',Helvetica] text-[#6b7280]">Funder not found.</p>
      </div>
    );
  }

  const days = funder.deadline
    ? Math.ceil((new Date(funder.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const opps = oppsForFunder ?? [];
  const singleOppLocked = opps.length === 1 && !!opps[0].isLocked;
  const multipleOpps = opps.length > 1;
  const generateDisabled = applyMutation.isPending || singleOppLocked;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#6b7280] hover:text-[#111827] transition-colors w-fit [font-family:'Montserrat',Helvetica] text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl sm:text-3xl tracking-[0.5px] uppercase leading-tight">
            {funder.name}
          </h1>
        </div>
        {multipleOpps && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={16} className="shrink-0 text-amber-700" />
            <p className="[font-family:'Montserrat',Helvetica] text-sm text-amber-900">
              This funder lists multiple grant opportunities. Start your application from{" "}
              <strong>Matches</strong> or <strong>Opportunities</strong> so we know which program you are applying to.
            </p>
          </div>
        )}
        {singleOppLocked && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <p className="[font-family:'Montserrat',Helvetica] text-sm text-red-700">
              This opportunity has reached its application limit.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-4">
            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-base uppercase tracking-wide">
              Mission Statement
            </h2>
            <p className="[font-family:'Montserrat',Helvetica] text-[#374151] text-sm leading-relaxed">
              {funder.missionStatement || "No mission statement available."}
            </p>
          </div>

          {funder.matchReasons && funder.matchReasons.length > 0 && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-3">
              <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-base uppercase tracking-wide">
                Why This Funder Matches
              </h2>
              {funder.matchReasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" />
                  <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{r}</p>
                </div>
              ))}
            </div>
          )}

          {funder.pastGrantsAwarded && funder.pastGrantsAwarded.length > 0 && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-3">
              <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-base uppercase tracking-wide">
                Past Grant Recipients
              </h2>
              {funder.pastGrantsAwarded.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6b7280]" />
                  <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{r}</span>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-base uppercase tracking-wide">
                Notes
              </h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="[font-family:'Montserrat',Helvetica] text-sm text-[#ef3e34] hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <>
                <textarea
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] text-[#111827] focus:border-[#ef3e34] focus:outline-none"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this funder..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveNotesMutation.mutate()}
                    disabled={saveNotesMutation.isPending}
                    className="rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-semibold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029] disabled:opacity-50"
                  >
                    {saveNotesMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm [font-family:'Montserrat',Helvetica] text-[#6b7280]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151] leading-relaxed">
                {notes || "No notes yet. Click Edit to add notes."}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-4">
            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm uppercase tracking-wide">
              Grant Details
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide">Range</p>
                <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-lg">
                  {fmt(funder.avgGrantMin)} – {fmt(funder.avgGrantMax)}
                </p>
              </div>
              {funder.deadline && (
                <div>
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide">Next Deadline</p>
                  <p className={`[font-family:'Montserrat',Helvetica] font-semibold text-sm ${days != null && days <= 14 ? "text-red-600" : "text-[#111827]"}`}>
                    {new Date(funder.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {days != null && ` (${days} days)`}
                  </p>
                </div>
              )}
              {funder.cyclesPerYear && (
                <div>
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide">Cycles/Year</p>
                  <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{funder.cyclesPerYear}</p>
                </div>
              )}
              <div>
                <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide">Location Focus</p>
                <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{funder.locationFocus?.join(", ") || "—"}</p>
              </div>
              {funder.equipmentTags && funder.equipmentTags.length > 0 && (
                <div>
                  <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide">Equipment focus</p>
                  <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{funder.equipmentTags.join(", ")}</p>
                </div>
              )}
              <div>
                <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af] uppercase tracking-wide">Local match</p>
                <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">
                  {funder.localMatchRequired ? "Typically required" : "Not flagged"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col gap-4">
            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-sm uppercase tracking-wide">
              Contact
            </h2>
            <div className="flex flex-col gap-3">
              {funder.contactName && (
                <div className="flex items-center gap-2">
                  <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{funder.contactName}</span>
                </div>
              )}
              {funder.contactEmail && (
                <a href={`mailto:${funder.contactEmail}`} className="flex items-center gap-2 text-[#ef3e34] hover:underline">
                  <Mail size={14} />
                  <span className="[font-family:'Montserrat',Helvetica] text-sm">{funder.contactEmail}</span>
                </a>
              )}
              {funder.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#9ca3af]" />
                  <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#374151]">{funder.contactPhone}</span>
                </div>
              )}
              {funder.website && (
                <a href={funder.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#ef3e34] hover:underline">
                  <Globe size={14} />
                  <span className="[font-family:'Montserrat',Helvetica] text-sm">Visit Website</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {multipleOpps ? (
              <>
                <p className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                  Select a grant program to apply
                </p>
                {opps.map((opp) => (
                  <button
                    key={opp._id}
                    type="button"
                    onClick={() => applyMutation.mutate(opp._id)}
                    disabled={applyMutation.isPending || !!opp.isLocked}
                    className="w-full rounded-lg bg-[#ef3e34] px-4 py-2.5 text-sm font-bold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029] disabled:opacity-50 transition-colors text-left"
                  >
                    {opp.isLocked ? (
                      <span className="opacity-60">🔒 {opp.title}</span>
                    ) : (
                      opp.title
                    )}
                  </button>
                ))}
              </>
            ) : (
              <button
                type="button"
                onClick={() => applyMutation.mutate(undefined)}
                disabled={generateDisabled}
                className="w-full rounded-lg bg-[#ef3e34] px-4 py-3 text-sm font-bold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029] disabled:opacity-50 transition-colors"
              >
                {applyMutation.isPending ? "Generating Application..." : "Generate Application"}
              </button>
            )}
            <button
              type="button"
              onClick={() => outreachMutation.mutate()}
              disabled={outreachMutation.isPending}
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm font-semibold text-[#374151] [font-family:'Montserrat',Helvetica] hover:bg-[#f9fafb] disabled:opacity-50 transition-colors"
            >
              {outreachMutation.isPending ? "Generating..." : "Generate Outreach Email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
