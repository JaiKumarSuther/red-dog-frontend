"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

function formatList(val: unknown) {
  if (Array.isArray(val)) return val.length ? val.join(", ") : "—";
  return "—";
}

type ApplicantRow = {
  organization?: { name?: string; location?: string };
  status?: string;
  createdAt?: string;
  projectTitle?: string;
};

export default function AdminFunderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "funder", id],
    queryFn: async () => {
      const res = await adminApi.get(`admin/funders/${id}`);
      return res.data.data as Record<string, unknown>;
    },
    enabled: Boolean(id),
  });

  const del = useMutation({
    mutationFn: () => adminApi.delete(`admin/funders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "funders"] });
      router.push("/admin/funders");
    },
  });

  if (!id) return null;

  if (isLoading) return <p className="text-[#6b7280]">Loading…</p>;
  if (isError || !data) return <p className="text-red-600">Funder not found.</p>;

  const applicantOrgs = (data.applicantOrgs as ApplicantRow[] | undefined) ?? [];

  const rows: [string, React.ReactNode][] = [
    ["Name", String(data.name ?? "")],
    ["Website", data.website ? String(data.website) : "—"],
    ["Contact", [data.contactName, data.contactEmail, data.contactPhone].filter(Boolean).join(" · ") || "—"],
    ["Mission", data.missionStatement ? String(data.missionStatement) : "—"],
    ["Location focus", formatList(data.locationFocus)],
    ["Funding categories", formatList(data.fundingCategories)],
    ["Agency types funded", formatList(data.agencyTypesFunded)],
    ["Equipment tags", formatList(data.equipmentTags)],
    ["Local match required", data.localMatchRequired ? "Yes" : "No"],
    [
      "Grant range",
      `$${Number(data.avgGrantMin || 0).toLocaleString()} – $${Number(data.avgGrantMax || 0).toLocaleString()}`,
    ],
    ["Deadline", data.deadline ? new Date(String(data.deadline)).toLocaleDateString() : "—"],
    ["Cycles per year", String(data.cyclesPerYear ?? "—")],
    ["Past grants", formatList(data.pastGrantsAwarded)],
    ["Notes", data.notes ? String(data.notes) : "—"],
    ["Status", String(data.status ?? "—")],
    ["Created", data.createdAt ? new Date(String(data.createdAt)).toLocaleString() : "—"],
    ["Updated", data.updatedAt ? new Date(String(data.updatedAt)).toLocaleString() : "—"],
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <AdminBackLink href="/admin/funders">Back to funders</AdminBackLink>
          <h1 className="mt-2 [font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">
            {String(data.name)}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-[#ef3e34] hover:bg-[#d63530]">
            <Link href={`/admin/funders/${id}/edit`}>Edit</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => {
              if (confirm("Delete this funder?")) del.mutate();
            }}
            disabled={del.isPending}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-wide text-[#9ca3af]">{label}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-[#111827]">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h2 className="[font-family:'Montserrat',Helvetica] text-sm font-bold uppercase tracking-wide text-[#111827]">
          Agencies with applications
        </h2>
        {applicantOrgs.length === 0 ? (
          <p className="mt-3 text-sm text-[#9ca3af]">No applications yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#f0f0f0] text-[#6b7280]">
                <tr>
                  <th className="pb-2 pr-3 font-semibold">Agency</th>
                  <th className="pb-2 pr-3 font-semibold">Project</th>
                  <th className="pb-2 pr-3 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {applicantOrgs.map((row, i) => (
                  <tr key={i} className="border-t border-[#f9fafb]">
                    <td className="py-2 pr-3 text-[#111827]">
                      {row.organization?.name ?? "—"}
                      {row.organization?.location ? (
                        <span className="block text-xs text-[#9ca3af]">{row.organization.location}</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-[#6b7280]">{row.projectTitle ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <span className="rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs capitalize text-[#374151]">
                        {String(row.status ?? "—")}
                      </span>
                    </td>
                    <td className="py-2 text-[#6b7280]">
                      {row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
