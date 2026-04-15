"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";

type Actor = { email?: string; firstName?: string; lastName?: string };

type LogRow = {
  _id: string;
  category: string;
  action: string;
  summary: string;
  severity: string;
  createdAt?: string;
  actorId?: Actor | string | null;
  meta?: Record<string, unknown>;
};

export default function AdminActivityPage() {
  const [category, setCategory] = useState("");

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin", "activity-logs", category],
    queryFn: async () => {
      const res = await adminApi.get("admin/activity-logs", {
        params: {
          limit: 100,
          page: 1,
          ...(category ? { category } : {}),
        },
      });
      return res.data;
    },
  });

  const rows = (data?.data ?? []) as LogRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Activity log</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Grants, funders, AI generations, match recomputes, and staff actions (agencies never see this).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            <option value="opportunity">Opportunities</option>
            <option value="funder">Funders</option>
            <option value="application">Applications</option>
            <option value="match">Matches</option>
            <option value="ai">AI</option>
            <option value="user">Users</option>
            <option value="system">System</option>
          </select>
          <button
            type="button"
            className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
            onClick={() => refetch()}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f9fafb] text-[#6b7280]">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Category</th>
              <th className="p-3">Action</th>
              <th className="p-3">Summary</th>
              <th className="w-14 p-3 text-center" aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#6b7280]">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#6b7280]">
                  No log entries yet. Actions from the staff portal will appear here.
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((r) => (
                <tr key={r._id} className="border-t border-[#f0f0f0]">
                  <td className="whitespace-nowrap p-3 text-[#374151]">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs font-medium text-[#374151]">
                      {r.category}
                    </span>
                  </td>
                  <td className="p-3 text-[#6b7280]">{r.action}</td>
                  <td className="max-w-[200px] truncate p-3 text-[#111827]" title={r.summary}>
                    {r.summary}
                  </td>
                  <td className="p-3 text-center">
                    <AdminTableViewLink href={`/admin/activity/${r._id}`} label="View log entry" />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#9ca3af]">
        Follow-up reminder emails (Day 7 / Day 14 after submission) are queued when an application moves to Submitted; the
        outbox worker sends them hourly when SMTP is configured.
      </p>
    </div>
  );
}
