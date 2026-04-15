"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { Input } from "@/components/ui/input";

type OutreachRow = {
  _id: string;
  subject?: string;
  status?: string;
  contactName?: string;
  sentAt?: string;
  updatedAt?: string;
  funder?: { name?: string };
  opportunity?: { title?: string };
};

export const OutreachList = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading, isError, refetch } = useQuery<OutreachRow[]>({
    queryKey: qk.outreach(),
    queryFn: async () => {
      const res = await api.get("/outreach", { params: { limit: 100 } });
      return (res.data.data ?? []) as OutreachRow[];
    },
  });

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.subject || "").toLowerCase().includes(q) ||
      (r.funder?.name || "").toLowerCase().includes(q) ||
      (r.opportunity?.title || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-4 bg-neutral-50 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="[font-family:'Oswald',Helvetica] text-2xl font-bold uppercase tracking-[0.5px] text-black sm:text-3xl">
          Outreach
        </h1>
        <p className="mt-1 [font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
          Draft and sent emails to funders
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
        <Input
          className="pl-9"
          placeholder="Search subject or funder..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError && (
        <p className="text-sm text-red-600 [font-family:'Montserrat',Helvetica]">
          Failed to load outreach.{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      )}

      {isLoading ? (
        <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-10 text-center [font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
          No outreach emails yet. Generate one from a funder or opportunity detail page.
        </div>
      ) : (
        <ul className="divide-y divide-[#f0f0f0] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          {filtered.map((r) => (
            <li key={r._id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#fafafa] sm:px-5"
                onClick={() => router.push(`/outreach/${r._id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#111827] line-clamp-1">
                    {r.subject || "Untitled outreach"}
                  </p>
                  <p className="mt-0.5 [font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                    {r.funder?.name || r.opportunity?.title || "—"} ·{" "}
                    <span className="capitalize">{r.status || "draft"}</span>
                    {r.sentAt && ` · Sent ${new Date(r.sentAt).toLocaleDateString()}`}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-[#9ca3af]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
