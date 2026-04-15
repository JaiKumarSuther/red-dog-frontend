"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

type CreatedBy = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type ApplicationSummary = {
  _id: string;
  status: string;
  amountRequested?: number;
  contactName?: string;
  contactEmail?: string;
  projectTitle?: string;
  updatedAt?: string;
  organization?: { name?: string; location?: string; agencyTypes?: string[] };
  funder?: { name?: string };
};

type OpportunityDetail = {
  _id: string;
  title: string;
  funder: string;
  deadline?: string;
  status: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  sourceUrl?: string;
  keywords?: string[];
  equipmentTags?: string[];
  localMatchRequired?: boolean;
  agencyTypes?: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: CreatedBy | string;
  applications: ApplicationSummary[];
  maxApplicationsAllowed?: number;
  currentApplicationCount?: number;
  isLocked?: boolean;
};

function formatAmountRange(min?: number, max?: number) {
  if (min == null && max == null) return "—";
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function createdByLabel(cb: OpportunityDetail["createdBy"]) {
  if (!cb || typeof cb === "string") return "—";
  const name = [cb.firstName, cb.lastName].filter(Boolean).join(" ");
  return name || cb.email || "—";
}

export default function AdminOpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const [maxInput, setMaxInput] = useState("0");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "opportunity", id],
    queryFn: async () => {
      const res = await adminApi.get(`admin/opportunities/${id}`);
      return res.data.data as OpportunityDetail;
    },
    enabled: Boolean(id),
  });

  const deleteOpp = useMutation({
    mutationFn: () => adminApi.delete(`admin/opportunities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "opportunities"] });
      router.push("/admin/opportunities");
    },
  });

  const updateOppMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminApi.put(`admin/opportunities/${id}`, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "opportunity", id] });
      toast({ title: "Opportunity updated" });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Update failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (data) {
      setMaxInput(String(data.maxApplicationsAllowed ?? 0));
    }
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" className="-ml-3 h-auto gap-2 px-3 py-2 text-[#374151] hover:text-[#111827]" asChild>
            <Link href="/admin/opportunities">
              <ArrowLeft className="h-4 w-4" />
              Back to opportunities
            </Link>
          </Button>
          <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">
            Opportunity details
          </h1>
          {data?.title && <p className="text-sm text-[#6b7280]">{data.title}</p>}
        </div>
        {data && (
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-[#ef3e34] hover:bg-[#d63530]">
              <Link href={`/admin/opportunities/${data._id}/edit`}>Edit opportunity</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              disabled={deleteOpp.isPending}
              onClick={() => {
                if (confirm("Delete this opportunity?")) deleteOpp.mutate();
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-[#6b7280] [font-family:'Montserrat',Helvetica]">Loading…</p>
      )}
      {isError && (
        <p className="text-sm text-red-600 [font-family:'Montserrat',Helvetica]">
          Could not load this opportunity.{" "}
          <Link href="/admin/opportunities" className="font-medium underline">
            Return to list
          </Link>
        </p>
      )}
      {!isLoading && !isError && data && (
        <div className="space-y-10">
          <section className="space-y-3 text-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
              Overview
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[#6b7280]">Title</dt>
                <dd className="font-medium text-[#111827]">{data.title}</dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Funder</dt>
                <dd className="text-[#111827]">{data.funder}</dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Category</dt>
                <dd className="text-[#111827]">{data.category || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Status</dt>
                <dd className="text-[#111827]">{data.status}</dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Deadline</dt>
                <dd className="text-[#111827]">
                  {data.deadline ? new Date(String(data.deadline)).toLocaleString() : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Amount range</dt>
                <dd className="text-[#111827]">{formatAmountRange(data.minAmount, data.maxAmount)}</dd>
              </div>
                  <div>
                    <dt className="text-[#6b7280]">Local match required</dt>
                    <dd className="text-[#111827]">{data.localMatchRequired ? "Yes" : "No"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[#6b7280]">Equipment tags</dt>
                    <dd className="text-[#111827]">
                      {data.equipmentTags?.length ? data.equipmentTags.join(", ") : "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[#6b7280]">Official link</dt>
                <dd className="text-[#111827]">
                  {data.sourceUrl ? (
                    <a
                      href={data.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-[#ef3e34] hover:underline"
                    >
                      {data.sourceUrl}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#6b7280]">Keywords</dt>
                <dd className="text-[#111827]">{data.keywords?.length ? data.keywords.join(", ") : "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#6b7280]">Eligible agency types</dt>
                <dd className="text-[#111827]">
                  {data.agencyTypes?.length ? data.agencyTypes.join(", ") : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#6b7280]">Description</dt>
                <dd className="whitespace-pre-wrap text-[#374151]">{data.description || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Created</dt>
                <dd className="text-[#111827]">
                  {data.createdAt ? new Date(String(data.createdAt)).toLocaleString() : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Last updated</dt>
                <dd className="text-[#111827]">
                  {data.updatedAt ? new Date(String(data.updatedAt)).toLocaleString() : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#6b7280]">Created by</dt>
                <dd className="text-[#111827]">{createdByLabel(data.createdBy)}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4 rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
              Application Control
            </h2>
            <p className="text-sm text-[#6b7280]">
              When a limit is set (&gt; 0), new applications for this opportunity count toward the cap.{" "}
              <span className="font-medium text-[#374151]">0</span> means unlimited.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-[#6b7280]">Current applications</p>
                <p className="text-lg font-semibold text-[#111827]">{data.applications?.length ?? 0}</p>
              </div>
              {data.isLocked ? (
                <span className="inline-flex rounded-full bg-[#fee2e2] px-3 py-1 text-xs font-semibold text-[#dc2626]">
                  LOCKED
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#16a34a]">
                  OPEN
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#374151]">Max applications allowed</label>
                <Input
                  type="number"
                  min={0}
                  className="w-36 border-[#e5e7eb]"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="border-[#e5e7eb]"
                disabled={updateOppMutation.isPending}
                onClick={() => {
                  const n = parseInt(maxInput, 10);
                  if (Number.isNaN(n) || n < 0) {
                    toast({ title: "Enter a valid number (0 = unlimited)", variant: "destructive" });
                    return;
                  }
                  updateOppMutation.mutate({
                    maxApplicationsAllowed: n,
                    ...(n === 0 ? { isLocked: false } : {}),
                  });
                }}
              >
                Set Limit
              </Button>
              {data.isLocked && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#e5e7eb]"
                  disabled={updateOppMutation.isPending}
                  onClick={() =>
                    updateOppMutation.mutate({ isLocked: false, currentApplicationCount: 0 })
                  }
                >
                  Unlock
                </Button>
              )}
            </div>
            <p className="text-xs text-[#9ca3af]">
              When the limit is reached, agencies cannot generate new applications for this opportunity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[#ef3e34] [font-family:'Montserrat',Helvetica]">
              Applicants ({data.applications?.length ?? 0})
            </h2>
            {(!data.applications || data.applications.length === 0) && (
              <p className="text-sm text-[#6b7280] [font-family:'Montserrat',Helvetica]">
                No applications have been started for this opportunity yet.
              </p>
            )}
            {data.applications && data.applications.length > 0 && (
              <div className="overflow-x-auto rounded-md border border-[#e5e7eb] bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-[#f9fafb] text-left text-[#6b7280]">
                    <tr>
                      <th className="p-2">Agency</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Updated</th>
                      <th className="w-14 p-2 text-center" aria-label="View details" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.applications.map((app) => (
                      <tr key={String(app._id)} className="border-t border-[#f0f0f0]">
                        <td className="p-2">
                          <p className="font-medium text-[#111827]">{app.organization?.name || "—"}</p>
                          {app.organization?.location && (
                            <p className="text-xs text-[#6b7280]">{app.organization.location}</p>
                          )}
                        </td>
                        <td className="p-2">
                          <span className="inline-block rounded bg-[#f3f4f6] px-2 py-0.5 text-xs text-[#374151]">
                            {app.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-2 text-[#6b7280]">
                          {app.updatedAt ? new Date(String(app.updatedAt)).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-2 text-center">
                          <AdminTableViewLink href={`/admin/applications/${app._id}`} label="View application" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
