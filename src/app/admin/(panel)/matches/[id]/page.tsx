"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Breakdown = Record<string, number> | undefined;

type MatchDetail = {
  _id: string;
  fitScore?: number;
  tier?: "high" | "medium" | "low";
  breakdown?: Breakdown;
  matchReasons?: string[];
  lastUpdated?: string;
  updatedAt?: string;
  agencyName?: string;
  funderName?: string;
  organization?: { _id?: string; name?: string; location?: string; agencyTypes?: string[] };
  opportunity?: { _id?: string; title?: string; funder?: string; category?: string; keywords?: string[] };
  linkedApplication?: { _id: string; status: string } | null;
};

function scoreBadgeCls(score?: number) {
  if (typeof score !== "number") return "bg-[#f3f4f6] text-[#374151]";
  if (score >= 85) return "bg-[#dcfce7] text-[#166534]";
  if (score >= 70) return "bg-[#dbeafe] text-[#1e40af]";
  if (score >= 50) return "bg-[#fef9c3] text-[#854d0e]";
  return "bg-[#fee2e2] text-[#991b1b]";
}

function tierBadgeCls(tier?: MatchDetail["tier"]) {
  if (tier === "high") return "bg-[#dcfce7] text-[#166534]";
  if (tier === "medium") return "bg-[#dbeafe] text-[#1e40af]";
  if (tier === "low") return "bg-[#fef9c3] text-[#854d0e]";
  return "bg-[#f3f4f6] text-[#374151]";
}

function breakdownRows(b: Breakdown) {
  if (!b || typeof b !== "object") return [];
  return Object.entries(b)
    .filter(([, v]) => typeof v === "number" && v !== 0)
    .sort((a, z) => (z[1] ?? 0) - (a[1] ?? 0));
}

function uniqReasons(rs?: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rs || []) {
    const key = String(r).trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export default function AdminMatchDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "match", id],
    queryFn: async () => {
      const res = await adminApi.get(`admin/matches/${id}`);
      return res.data.data as MatchDetail;
    },
    enabled: Boolean(id),
  });

  const agency = data?.agencyName ?? data?.organization?.name ?? "—";
  const opportunity = data?.opportunity?.title ?? "—";
  const updated = data?.lastUpdated ?? data?.updatedAt;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" className="-ml-3 h-auto gap-2 px-3 py-2 text-[#374151] hover:text-[#111827]" asChild>
            <Link href="/admin/matches">
              <ArrowLeft className="h-4 w-4" />
              Back to matches
            </Link>
          </Button>
          <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Match details</h1>
          <p className="text-sm text-[#6b7280]">
            <span className="font-medium text-[#374151]">{agency}</span> · {opportunity}
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#6b7280] [font-family:'Montserrat',Helvetica]">Loading…</p>}
      {isError && (
        <p className="text-sm text-red-600 [font-family:'Montserrat',Helvetica]">
          Could not load this match.{" "}
          <Link href="/admin/matches" className="font-medium underline">
            Return to list
          </Link>
        </p>
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-8">
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
              Overview
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#6b7280]">Agency</dt>
                <dd className="font-medium text-[#111827]">{agency}</dd>
                {data.organization?.location ? (
                  <dd className="mt-0.5 text-xs text-[#6b7280]">{data.organization.location}</dd>
                ) : null}
              </div>
              <div>
                <dt className="text-xs text-[#6b7280]">Opportunity</dt>
                <dd className="font-medium text-[#111827]">{opportunity}</dd>
                {data.opportunity?.funder ? (
                  <dd className="mt-0.5 text-xs text-[#6b7280]">{data.opportunity.funder}</dd>
                ) : null}
              </div>
              <div>
                <dt className="text-xs text-[#6b7280]">Fit score</dt>
                <dd className="mt-1">
                  <Badge className={`${scoreBadgeCls(data.fitScore)} border-0`}>
                    {typeof data.fitScore === "number" ? data.fitScore : "—"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#6b7280]">Tier</dt>
                <dd className="mt-1">
                  <Badge className={`${tierBadgeCls(data.tier)} border-0 capitalize`}>{data.tier ?? "—"}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#6b7280]">Date computed</dt>
                <dd className="text-[#111827]">{updated ? new Date(updated).toLocaleString() : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#6b7280]">Application</dt>
                <dd className="mt-1 flex items-center gap-2">
                  {data.linkedApplication ? (
                    <>
                      <Badge className="border-0 bg-[#f3f4f6] text-[#374151] capitalize">
                        {data.linkedApplication.status.replace(/_/g, " ")}
                      </Badge>
                      <AdminTableViewLink
                        href={`/admin/applications/${data.linkedApplication._id}`}
                        label="View application"
                      />
                    </>
                  ) : (
                    <span className="text-sm text-[#6b7280]">No application yet</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
              Score breakdown
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {breakdownRows(data.breakdown).length === 0 ? (
                <p className="text-sm text-[#6b7280]">—</p>
              ) : (
                breakdownRows(data.breakdown).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-md border border-[#f0f0f0] p-3">
                    <span className="text-sm text-[#374151]">{k}</span>
                    <span className="text-sm font-semibold text-[#111827]">{v}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
              Match reasons
            </h2>
            <div className="mt-4">
              {uniqReasons(data.matchReasons).length === 0 ? (
                <p className="text-sm text-[#6b7280]">—</p>
              ) : (
                <ul className="list-disc space-y-2 pl-5 text-sm text-[#374151]">
                  {uniqReasons(data.matchReasons).map((r, idx) => (
                    <li key={`${idx}-${r}`}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

