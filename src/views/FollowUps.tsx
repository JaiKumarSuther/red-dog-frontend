"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Send, SkipForward, Mail } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FollowUpRow = {
  _id: string;
  followUpNumber?: number;
  scheduledFor?: string;
  status?: string;
  emailSubject?: string;
  emailBody?: string;
  application?: { projectTitle?: string; _id?: string };
  funder?: { name?: string };
};

export const FollowUps = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading, isError, refetch } = useQuery<FollowUpRow[]>({
    queryKey: qk.followups(),
    queryFn: async () => {
      const res = await api.get("/followups", { params: { limit: 100 } });
      return (res.data.data ?? []) as FollowUpRow[];
    },
  });

  const sendMut = useMutation({
    mutationFn: (fid: string) => api.put(`/followups/${fid}/send`),
    onSuccess: () => {
      toast({ title: "Marked as sent" });
      void qc.invalidateQueries({ queryKey: qk.followups() });
    },
    onError: () => toast({ title: "Error", description: "Could not update follow-up.", variant: "destructive" }),
  });

  const skipMut = useMutation({
    mutationFn: (fid: string) => api.put(`/followups/${fid}/skip`),
    onSuccess: () => {
      toast({ title: "Follow-up skipped" });
      void qc.invalidateQueries({ queryKey: qk.followups() });
    },
    onError: () => toast({ title: "Error", description: "Could not skip follow-up.", variant: "destructive" }),
  });

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.application?.projectTitle || "").toLowerCase().includes(q) ||
      (r.funder?.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-4 bg-neutral-50 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="[font-family:'Oswald',Helvetica] text-2xl font-bold uppercase tracking-[0.5px] text-black sm:text-3xl">
          Follow-ups
        </h1>
        <p className="mt-1 [font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
          Day 7 and Day 14 reminders after you submit an application
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
        <Input
          className="pl-9"
          placeholder="Search by application or funder..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError && (
        <p className="text-sm text-red-600 [font-family:'Montserrat',Helvetica]">
          Failed to load follow-ups.{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      )}

      {isLoading ? (
        <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-10 text-center [font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
          No follow-ups yet. They appear after you submit an application.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((r) => {
            const dayLabel =
              r.followUpNumber === 2 ? "Day 14" : r.followUpNumber === 1 ? "Day 7" : `Follow-up ${r.followUpNumber ?? ""}`;
            return (
              <li
                key={r._id}
                className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="[font-family:'Montserrat',Helvetica] text-base font-semibold text-[#111827]">
                      {r.application?.projectTitle || "Application"}
                    </p>
                    <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
                      Funder: {r.funder?.name || "—"} · {dayLabel}
                    </p>
                    <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">
                      Scheduled:{" "}
                      {r.scheduledFor
                        ? new Date(r.scheduledFor).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}{" "}
                      · Status: <span className="font-medium capitalize text-[#374151]">{r.status || "—"}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="bg-[#ef3e34] hover:bg-[#d63029]"
                      disabled={sendMut.isPending || r.status !== "pending"}
                      onClick={() => sendMut.mutate(r._id)}
                    >
                      <Send className="mr-1 size-4" /> Send
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={skipMut.isPending || r.status !== "pending"}
                      onClick={() => skipMut.mutate(r._id)}
                    >
                      <SkipForward className="mr-1 size-4" /> Skip
                    </Button>
                  </div>
                </div>
                {(r.emailSubject || r.emailBody) && (
                  <div className="mt-4 rounded-lg border border-[#f3f4f6] bg-[#fafafa] p-3">
                    <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#9ca3af] [font-family:'Montserrat',Helvetica]">
                      <Mail size={12} /> Email preview
                    </p>
                    {r.emailSubject && (
                      <p className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827]">
                        {r.emailSubject}
                      </p>
                    )}
                    {r.emailBody && (
                      <p className="mt-2 whitespace-pre-wrap [font-family:'Montserrat',Helvetica] text-sm text-[#374151]">
                        {r.emailBody}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
