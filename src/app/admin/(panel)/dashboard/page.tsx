"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardData = {
  totalAgencies: number;
  totalOpportunities: number;
  totalApplications: number;
  totalFunders: number;
  awardsWon: number;
  applicationsSubmitted: number;
  recentSignups: {
    id: string;
    name: string;
    agencyTypes?: string[];
    location?: string;
    signupDate?: string;
  }[];
  recentApplications: {
    id: string;
    agencyName?: string;
    funderName?: string;
    status: string;
    updatedAt?: string;
  }[];
};

export default function AdminDashboardPage() {
  const qc = useQueryClient();
  const [recomputeMsg, setRecomputeMsg] = useState<string | null>(null);

  const recomputeMatches = useMutation({
    mutationFn: async () => {
      setRecomputeMsg(null);
      const res = await adminApi.post("admin/matches/recompute-all");
      return res.data;
    },
    onSuccess: (res) => {
      setRecomputeMsg((res.data as { message?: string })?.message || "Match scores updated for all agencies.");
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin", "activity-logs"] });
    },
    onError: () => setRecomputeMsg("Recompute failed."),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const res = await adminApi.get("admin/dashboard");
      return res.data.data as DashboardData;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-[#e5e7eb]" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg bg-[#e5e7eb]" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-lg bg-[#e5e7eb]" />
          <Skeleton className="h-80 rounded-lg bg-[#e5e7eb]" />
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Agencies", value: data.totalAgencies },
    { label: "Opportunities", value: data.totalOpportunities },
    { label: "Applications", value: data.totalApplications },
    { label: "Funders", value: data.totalFunders },
    { label: "Awards won", value: data.awardsWon },
    { label: "Submitted", value: data.applicationsSubmitted },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Dashboard</h1>
        <Button
          type="button"
          variant="outline"
          className="border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]"
          disabled={recomputeMatches.isPending}
          onClick={() => recomputeMatches.mutate()}
        >
          {recomputeMatches.isPending ? "Recomputing match scores…" : "Recompute all match scores"}
        </Button>
      </div>
      {recomputeMsg && (
        <p className="text-sm text-[#374151] [font-family:'Montserrat',Helvetica]">{recomputeMsg}</p>
      )}
      <p className="text-sm text-[#6b7280]">
        Staff-only audit trail:{" "}
        <Link href="/admin/activity" className="font-medium text-[#ef3e34] hover:underline">
          Activity log
        </Link>
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-[#6b7280]">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#111827]">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
            Recent signups
          </h2>
          <ul className="space-y-3 text-sm">
            {data.recentSignups?.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 border-b border-[#f0f0f0] pb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#111827]">{r.name}</p>
                  <p className="text-xs text-[#6b7280]">
                    {(r.agencyTypes || []).join(", ")} · {r.location}
                  </p>
                  <p className="text-xs text-[#9ca3af]">
                    {r.signupDate ? new Date(r.signupDate).toLocaleString() : ""}
                  </p>
                </div>
                <AdminTableViewLink href={`/admin/agencies/${r.id}`} label="View agency" />
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
            Recent applications
          </h2>
          <ul className="space-y-3 text-sm">
            {data.recentApplications?.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 border-b border-[#f0f0f0] pb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[#111827]">{r.agencyName}</p>
                  <p className="text-[#6b7280]">{r.funderName}</p>
                  <span className="mt-1 inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#374151]">
                    {r.status}
                  </span>
                </div>
                <AdminTableViewLink href={`/admin/applications/${r.id}`} label="View application" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
