"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Eye, Calendar, Zap, Mail, Send, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DigestOpp = {
  title: string;
  fitScore: number;
  amount: string;
};

type Digest = {
  id: string;
  org: string;
  dateRange: string;
  matches: number;
  status: string;
  previewTitle: string;
  previewSubtitle: string;
  aiIntro: string;
  opportunities: DigestOpp[];
};

type ApiDigest = {
  _id: string;
  orgName?: string;
  periodStart?: string;
  weekStart?: string;
  periodEnd?: string;
  weekEnd?: string;
  status?: string;
  intro?: string;
  aiIntro?: string;
  opportunities?: {
    title?: string;
    fitScore?: number;
    amount?: number;
    maxAmount?: number;
    amountRange?: string;
  }[];
};

const fmtRange = (start: string | undefined, end: string | undefined) => {
  const fmt = (s: string) => {
    try {
      return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return s;
    }
  };
  if (!start && !end) return "—";
  if (!end) return fmt(start!);
  const year = new Date(end).getFullYear();
  return `${fmt(start!)} – ${fmt(end!)}, ${year}`;
};

const mapDigest = (d: ApiDigest): Digest => {
  const orgName = d.orgName ?? "Unknown";
  const opps = d.opportunities ?? [];
  return {
    id: d._id,
    org: orgName,
    dateRange: fmtRange(d.periodStart ?? d.weekStart, d.periodEnd ?? d.weekEnd),
    matches: opps.length,
    status: d.status ?? "draft",
    previewTitle: `${orgName.toUpperCase()} GRANT INTELLIGENCE`,
    previewSubtitle: `Weekly Digest for ${orgName}`,
    aiIntro: d.aiIntro ?? d.intro ?? `AI-powered introduction: This week we identified high-fit grant opportunities tailored to your organization's mission and focus areas.`,
    opportunities: opps.map((o) => ({
      title: (o.title ?? "Grant Opportunity").toUpperCase(),
      fitScore: o.fitScore ?? 0,
      amount: o.amountRange ?? (o.amount ? `Up to $${o.amount.toLocaleString()}` : (o.maxAmount ? `Up to $${o.maxAmount.toLocaleString()}` : "—")),
    })),
  };
};

const statusBadge = (s: string) =>
  s === "sent"
    ? "bg-[#dcfce7] text-[#16a34a]"
    : "bg-[#fef9c3] text-[#b45309]";

const scoreColor = (n: number) => {
  if (n >= 80) return "text-[#16a34a]";
  if (n >= 65) return "text-[#f97316]";
  return "text-[#ef4444]";
};

const LivePreview = ({ digest }: { digest: Digest | null }) => {
  if (!digest) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
        <div className="w-16 h-16 rounded-full bg-[#f3f4f6] flex items-center justify-center">
          <Mail size={28} className="text-[#d1d5db]" />
        </div>
        <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-sm text-center">
          Click Preview on a digest to see the email here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#f0f0f0]">
      <div className="bg-[#ef3e34] px-4 py-4 sm:px-5">
        <p className="[font-family:'Oswald',Helvetica] text-base font-bold uppercase leading-snug tracking-[0.5px] text-white break-words">
          {digest.previewTitle}
        </p>
        <p className="[font-family:'Montserrat',Helvetica] font-normal text-white/80 text-xs mt-0.5">
          {digest.previewSubtitle}
        </p>
      </div>

      <div className="bg-[#fff4f4] border-l-4 border-[#ef3e34] px-4 py-3 mx-4 mt-4 rounded-r-lg">
        <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#374151] text-sm leading-5">
          {digest.aiIntro}
        </p>
      </div>

      <div className="px-4 pt-4 pb-5 flex flex-col gap-3">
        <p className="[font-family:'Oswald',Helvetica] font-bold text-[#111827] text-sm tracking-[0.5px] uppercase">
          Top Opportunities This Week
        </p>
        {digest.opportunities.map((opp, i) => (
          <div key={i} className="bg-white rounded-lg border border-[#f0f0f0] px-4 py-3">
            <p className="[font-family:'Oswald',Helvetica] font-bold text-[#111827] text-sm uppercase tracking-[0.3px]">
              {opp.title}
            </p>
            <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-xs mt-1">
              Fit Score:{" "}
              <span className={`font-bold ${scoreColor(opp.fitScore)}`}>
                {opp.fitScore}/100
              </span>{" "}
              | Amount: {opp.amount}
            </p>
          </div>
        ))}
        {digest.opportunities.length === 0 && (
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-sm">No opportunities this week</p>
        )}
      </div>
    </div>
  );
};

export const WeeklySummary = () => {
  const [selected, setSelected] = useState<Digest | null>(null);
  const [sendEmail, setSendEmail] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: digests = [], isLoading: loading } = useQuery<Digest[]>({
    queryKey: qk.digests(),
    queryFn: async () => {
      const res = await api.get("/digests", { params: { limit: 20 } });
      const raw: ApiDigest[] = res.data.data ?? [];
      return raw.map(mapDigest);
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post("/digests/generate", {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.digests() });
      toast({ title: "Digest generated", description: "A new weekly summary draft was created." });
      setSelected(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not generate digest.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, recipientEmail, recipientName }: { id: string; recipientEmail: string; recipientName?: string }) =>
      api.post(`/digests/${id}/send`, { recipientEmail, recipientName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.digests() });
      toast({ title: "Digest sent", description: "The weekly summary was queued for email delivery." });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not send digest.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const defaultEmail = user?.email?.trim() ?? "";
  const effectiveSendEmail = sendEmail.trim() || defaultEmail;

  return (
    <div className="flex h-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 sm:p-6 lg:p-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
        <h1 className="[font-family:'Oswald',Helvetica] text-2xl font-bold uppercase leading-tight tracking-[0.5px] text-black sm:text-3xl break-words">
          Weekly Summary
        </h1>
        <p className="[font-family:'Montserrat',Helvetica] text-sm font-normal text-[#6b7280] max-w-prose break-words">
          Manage and dispatch automated grant reports
        </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-md">
          <Button
            type="button"
            className="w-full bg-[#ef3e34] hover:bg-[#d63530] sm:w-auto"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            <Sparkles size={16} className="mr-2" />
            {generateMutation.isPending ? "Generating…" : "Generate new digest"}
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="email"
              placeholder="Recipient email"
              className="border-[#e5e7eb] text-sm"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 border-[#e5e7eb]"
              disabled={!selected || sendMutation.isPending || !effectiveSendEmail}
              onClick={() => {
                if (!selected) return;
                sendMutation.mutate({
                  id: selected.id,
                  recipientEmail: effectiveSendEmail,
                  recipientName: user?.fullName ?? user?.firstName,
                });
              }}
            >
              <Send size={16} className="mr-2" />
              {sendMutation.isPending ? "Sending…" : "Send selected"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
        <div className="flex max-h-[min(52vh,28rem)] w-full shrink-0 flex-col overflow-hidden rounded-xl border border-[#f0f0f0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] lg:max-h-none lg:w-80 lg:max-w-[320px]">
          <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-4 py-4 sm:px-5">
            <FileText size={14} className="shrink-0 text-[#9ca3af]" />
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#9ca3af] text-xs tracking-[0.6px] uppercase">
              Recent Weekly Summary
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[#f9fafb] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">Loading...</span>
              </div>
            ) : digests.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">No digests yet</span>
              </div>
            ) : (
              digests.map((d) => {
                const isSelected = selected?.id === d.id;
                return (
                  <div
                    key={d.id}
                    className={`relative flex flex-col gap-2 px-4 py-4 transition-colors sm:px-5 ${
                      isSelected ? "bg-[#fff4f4]" : "hover:bg-[#fafafa]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ef3e34] rounded-r-full" />
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#111827] text-sm">
                        {d.org}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full [font-family:'Montserrat',Helvetica] font-semibold text-xs capitalize ${statusBadge(d.status)}`}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-[#9ca3af]" />
                      <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs">
                        {d.dateRange}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs">
                        {d.matches} matches
                      </span>
                      <button
                        onClick={() => setSelected(isSelected ? null : d)}
                        data-testid={`button-preview-digest-${d.id}`}
                        className="flex items-center gap-1 [font-family:'Montserrat',Helvetica] font-semibold text-[#ef3e34] text-xs hover:underline transition-colors"
                      >
                        <Zap size={11} />
                        Preview
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex min-h-[min(50vh,24rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#f0f0f0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] lg:min-h-0">
          <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-4 py-4 sm:px-5">
            <Eye size={14} className="shrink-0 text-[#9ca3af]" />
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#9ca3af] text-xs tracking-[0.6px] uppercase">
              Live Preview
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <LivePreview digest={selected} />
          </div>
        </div>
      </div>
    </div>
  );
};
