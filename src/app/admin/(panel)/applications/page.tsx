"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "draft", label: "Draft" },
  { value: "drafting", label: "Drafting" },
  { value: "awarded", label: "Awarded" },
] as const;

export default function AdminApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agencyId, setAgencyId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin", "applications", statusFilter, agencyId, dateFrom, dateTo],
    queryFn: async () => {
      const res = await adminApi.get("admin/applications", {
        params: {
          limit: 50,
          status: statusFilter === "all" ? undefined : statusFilter,
          agencyId: agencyId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      });
      return res.data;
    },
  });

  const rows = (data?.data ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Applications</h1>
      <p className="text-sm text-[#6b7280]">
        <span className="font-medium text-[#374151]">All</span> includes drafts and in-progress applications. Choose{" "}
        <span className="font-medium text-[#374151]">Pending Review</span> for submissions that still need an approve or
        reject decision (<span className="font-medium text-[#374151]">submitted</span> /{" "}
        <span className="font-medium text-[#374151]">in review</span> only).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-10 min-w-[160px] rounded-md border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Input
          placeholder="Agency ID"
          className="w-52 border-[#e5e7eb]"
          value={agencyId}
          onChange={(e) => setAgencyId(e.target.value)}
        />
        <Input type="date" className="border-[#e5e7eb]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" className="border-[#e5e7eb]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Button variant="secondary" type="button" onClick={() => refetch()}>
          Filter
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white text-sm shadow-sm">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-[#f9fafb] text-[#6b7280]">
            <tr>
              <th className="p-3">Agency</th>
              <th className="p-3">Opportunity</th>
              <th className="p-3">Funder</th>
              <th className="p-3">Match score</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date submitted</th>
              <th className="w-14 p-3 text-center" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#9ca3af]">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#9ca3af]">
                  No applications match this filter.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const submitted =
                  (r.dateSubmitted as string | undefined) ||
                  (r.submittedAt as string | undefined) ||
                  (r.createdAt as string | undefined);
                const opp = r.opportunity as { title?: string } | undefined;
                const fitScore = r.fitScore as number | null | undefined;
                return (
                  <tr key={String(r._id)} className="border-t border-[#f0f0f0]">
                    <td className="p-3 font-medium text-[#111827]">
                      {(r.organization as { name?: string })?.name}
                    </td>
                    <td className="p-3 text-[#6b7280]">{opp?.title ?? "—"}</td>
                    <td className="p-3 text-[#6b7280]">
                      {(r.funder as { name?: string })?.name ||
                        (r.opportunity as { funder?: string })?.funder}
                    </td>
                    <td className="p-3 text-[#374151]">{fitScore != null ? String(fitScore) : "—"}</td>
                    <td className="p-3">
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs capitalize text-[#374151]">
                        {String(r.status).replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3 text-[#6b7280]">
                      {submitted ? new Date(submitted).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <AdminTableViewLink href={`/admin/applications/${r._id}`} label="View application details" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
