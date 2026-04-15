"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BUDGET_LABELS: Record<string, string> = {
  under_25k: "Under $25K",
  "25k_150k": "$25K – $150K",
  "150k_500k": "$150K – $500K",
  "500k_plus": "$500K+",
};

const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminAgenciesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "agencies", search, page],
    queryFn: async () => {
      const res = await adminApi.get("admin/agencies", { params: { search, page, limit: 20 } });
      return res.data;
    },
  });

  const rows = data?.data ?? [];
  const pg = data?.pagination;

  return (
    <div className="space-y-6">
      <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Agencies</h1>
      <div className="flex gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, type, location"
          className="max-w-md border-[#e5e7eb]"
        />
        <Button type="button" variant="secondary" onClick={() => refetch()}>
          Search
        </Button>
      </div>
      {isLoading ? (
        <p className="text-[#6b7280]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f9fafb] text-[#6b7280]">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Agency Types</th>
                <th className="p-3">Location</th>
                <th className="p-3">Budget Range</th>
                <th className="p-3">Status</th>
                <th className="w-14 p-3 text-center" aria-label="View details" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r: Record<string, unknown>) => (
                <tr key={String(r._id)} className="border-t border-[#f0f0f0]">
                  <td className="p-3 font-medium text-[#111827]">{String(r.name)}</td>
                  <td className="p-3 text-[#6b7280]">
                    {Array.isArray(r.agencyTypes) && (r.agencyTypes as string[]).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(r.agencyTypes as string[]).slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"
                          >
                            {formatType(t)}
                          </span>
                        ))}
                        {(r.agencyTypes as string[]).length > 2 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                            +{(r.agencyTypes as string[]).length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-[#6b7280]">{String(r.location || "—")}</td>
                  <td className="p-3 text-[#6b7280]">
                    {r.budgetRange ? (BUDGET_LABELS[String(r.budgetRange)] || String(r.budgetRange)) : "—"}
                  </td>
                  <td className="p-3">
                    {String(r.status || "").toLowerCase() === "active" ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : String(r.status || "").trim() ? (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        {String(r.status)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        —
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <AdminTableViewLink href={`/admin/agencies/${r._id}`} label="View agency details" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pg && pg.totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="self-center text-sm text-[#6b7280]">
            Page {pg.page} / {pg.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={!pg.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
