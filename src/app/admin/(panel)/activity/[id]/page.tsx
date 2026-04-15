"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminBackLink } from "@/components/admin/AdminBackLink";

type Actor = { email?: string; firstName?: string; lastName?: string };

export default function AdminActivityDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "activity-log", id],
    queryFn: async () => {
      const res = await adminApi.get(`admin/activity-logs/${id}`);
      return res.data.data as {
        _id: string;
        category: string;
        action: string;
        summary: string;
        severity?: string;
        createdAt?: string;
        actorId?: Actor | string | null;
        meta?: Record<string, unknown>;
      };
    },
    enabled: Boolean(id),
  });

  if (!id) return null;

  if (isLoading) return <p className="text-[#6b7280]">Loading…</p>;
  if (isError || !data) return <p className="text-red-600">Log entry not found.</p>;

  const actor = data.actorId && typeof data.actorId === "object" ? data.actorId : null;
  const actorLabel = actor
    ? [actor.firstName, actor.lastName].filter(Boolean).join(" ") || actor.email || "—"
    : "—";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <AdminBackLink href="/admin/activity">Back to activity log</AdminBackLink>
        <h1 className="mt-2 [font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">
          Activity entry
        </h1>
        <p className="text-sm text-[#6b7280]">{data.category} · {data.action}</p>
      </div>

      <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm text-sm">
        <p>
          <span className="text-[#9ca3af]">When:</span>{" "}
          {data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}
        </p>
        <p>
          <span className="text-[#9ca3af]">Category:</span> {data.category}
        </p>
        <p>
          <span className="text-[#9ca3af]">Action:</span> {data.action}
        </p>
        <p>
          <span className="text-[#9ca3af]">Severity:</span> {data.severity ?? "info"}
        </p>
        <p>
          <span className="text-[#9ca3af]">Actor:</span> {actorLabel}
        </p>
        <div>
          <p className="mb-1 text-[#9ca3af]">Summary</p>
          <p className="whitespace-pre-wrap text-[#111827]">{data.summary}</p>
        </div>
        {data.meta && Object.keys(data.meta).length > 0 && (
          <div>
            <p className="mb-1 text-[#9ca3af]">Meta</p>
            <pre className="max-h-96 overflow-auto rounded bg-[#f9fafb] p-3 text-xs text-[#374151]">
              {JSON.stringify(data.meta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
