"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Send } from "lucide-react";

interface OutreachEmail {
  _id: string;
  subject: string;
  contactName?: string;
  body: string;
  status: "draft" | "sent";
  sentAt?: string;
  funder?: { _id: string; name: string; contactName?: string; contactEmail?: string };
  opportunity?: { title: string; funder: string };
  organization?: { name: string };
}

export const OutreachBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [contactName, setContactName] = useState("");
  const [body, setBody] = useState("");

  const { data: email, isLoading, isError, refetch } = useQuery<OutreachEmail>({
    queryKey: qk.outreachItem(id),
    queryFn: async () => {
      const res = await api.get(`/outreach/${id}`);
      return res.data.data as OutreachEmail;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (email) {
      setSubject(email.subject || "");
      setContactName(email.contactName || "");
      setBody(email.body || "");
    }
  }, [email]);

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/outreach/${id}`, { subject, contactName, body }),
    onSuccess: () => {
      toast({ title: "Email saved" });
      queryClient.invalidateQueries({ queryKey: qk.outreachItem(id) });
      queryClient.invalidateQueries({ queryKey: qk.outreach() });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const markSentMutation = useMutation({
    mutationFn: () => api.put(`/outreach/${id}/sent`),
    onSuccess: () => {
      toast({ title: "Marked as sent" });
      queryClient.invalidateQueries({ queryKey: qk.outreachItem(id) });
      queryClient.invalidateQueries({ queryKey: qk.outreach() });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => api.post(`/outreach/${id}/send`),
    onSuccess: () => {
      toast({ title: "Email sent!", description: "Outreach email delivered to funder." });
      queryClient.invalidateQueries({ queryKey: qk.outreach() });
      queryClient.invalidateQueries({ queryKey: qk.outreachItem(id) });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send email.";
      toast({ title: "Send failed", description: msg, variant: "destructive" });
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\nDear ${contactName},\n\n${body}`);
    toast({ title: "Copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-6 bg-neutral-50 p-8">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-white border border-[#e5e7eb]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 bg-neutral-50 gap-3">
        <p className="[font-family:'Montserrat',Helvetica] text-red-600 text-base">Failed to load outreach email. Please try again.</p>
        <button onClick={() => refetch()} className="rounded-lg bg-[#ef3e34] px-4 py-2 text-sm font-semibold text-white [font-family:'Montserrat',Helvetica] hover:bg-[#d63029]">Retry</button>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex w-full items-center justify-center py-20 bg-neutral-50">
        <p className="[font-family:'Montserrat',Helvetica] text-[#6b7280]">Outreach email not found.</p>
      </div>
    );
  }

  const funderName = email.funder?.name || email.opportunity?.funder || "Unknown";

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#6b7280] hover:text-[#111827] transition-colors w-fit [font-family:'Montserrat',Helvetica] text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-2xl sm:text-3xl tracking-[0.5px] uppercase">
            Outreach Email
          </h1>
          <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
            To: {funderName}
            {email.status === "sent" && (
              <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Sent</span>
            )}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] text-[#374151] hover:bg-[#f9fafb]"
          >
            <Copy size={14} /> Copy Email
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || email.status === "sent"}
            className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold [font-family:'Montserrat',Helvetica] text-[#374151] hover:bg-[#f9fafb] disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
          {email.funder && !email.funder.contactEmail && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              ⚠️ No funder email on file — use manual send only.
            </p>
          )}

          {email.status !== "sent" && email.funder?.contactEmail && (
            <button
              type="button"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || saveMutation.isPending}
              className="px-4 py-2 bg-[#ef3e34] text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold text-sm"
            >
              {sendMutation.isPending ? "Sending..." : "Send Email"}
            </button>
          )}

          <button
            type="button"
            onClick={() => markSentMutation.mutate()}
            disabled={markSentMutation.isPending || email.status === "sent"}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm flex items-center gap-2"
          >
            {email.status === "sent" ? (
              "✓ Sent"
            ) : (
              <>
                <Send size={14} /> Mark as Sent Manually
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 flex flex-col gap-3">
          <label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#9ca3af] text-xs uppercase tracking-wide">
            Subject Line
          </label>
          <input
            className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={email.status === "sent"}
          />
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 flex flex-col gap-3">
          <label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#9ca3af] text-xs uppercase tracking-wide">
            Contact Name
          </label>
          <input
            className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            disabled={email.status === "sent"}
            placeholder="Program Officer"
          />
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 flex flex-col gap-3">
          <label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#9ca3af] text-xs uppercase tracking-wide">
            Email Body
          </label>
          <textarea
            className="w-full rounded-lg border border-[#e5e7eb] px-4 py-3 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20 min-h-[280px] resize-y"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={email.status === "sent"}
          />
        </div>
      </div>

      {email.status === "sent" && email.sentAt && (
        <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">
          Sent on {new Date(email.sentAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      )}
    </div>
  );
};
