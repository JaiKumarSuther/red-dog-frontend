"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className="text-sm text-[#374151]">
      <span className="text-[#9ca3af]">{label}:</span> {value ?? "—"}
    </p>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();
  const [roleDraft, setRoleDraft] = useState<"agency" | "admin" | "">("");
  const [confirmRole, setConfirmRole] = useState<"agency" | "admin" | null>(null);

  useEffect(() => {
    setRoleDraft("");
  }, [id]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: async () => {
      const res = await adminApi.get(`admin/users/${id}`);
      return res.data.data as Record<string, unknown>;
    },
    enabled: Boolean(id),
  });

  const currentRole = (data?.role as string) || "";
  const effectiveDraft = roleDraft || (currentRole === "admin" || currentRole === "agency" ? currentRole : "agency");

  const roleMutation = useMutation({
    mutationFn: (role: "agency" | "admin") => adminApi.put(`admin/users/${id}/role`, { role }),
    onSuccess: async (_, role) => {
      await qc.invalidateQueries({ queryKey: ["admin", "user", id] });
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setRoleDraft("");
      setConfirmRole(null);
      toast({ title: "Role updated", description: `User is now ${role}.` });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not update role.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setConfirmRole(null);
    },
  });

  if (!id) return null;

  if (isLoading) return <p className="text-[#6b7280]">Loading…</p>;
  if (isError || !data) return <p className="text-red-600">User not found.</p>;

  const org = data.organization as { name?: string; location?: string; agencyTypes?: string[] } | undefined;
  const settings = data.settings as Record<string, unknown> | undefined;
  const roleChanged = effectiveDraft !== currentRole;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <AdminBackLink href="/admin/users">Back to users</AdminBackLink>
        <h1 className="mt-2 [font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">User details</h1>
        <p className="text-sm text-[#6b7280]">{String(data.email ?? "")}</p>
      </div>

      <div className="space-y-4 rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Role</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="user-role" className="text-xs text-[#6b7280]">
                Portal access
              </label>
              <select
                id="user-role"
                className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827]"
                value={effectiveDraft}
                onChange={(e) => setRoleDraft(e.target.value as "agency" | "admin")}
              >
                <option value="agency">Agency</option>
                <option value="admin">Admin / staff</option>
              </select>
            </div>
            <Button
              type="button"
              className="bg-[#ef3e34] hover:bg-[#d63530]"
              disabled={!roleChanged || roleMutation.isPending}
              onClick={() => setConfirmRole(effectiveDraft)}
            >
              Save role
            </Button>
          </div>
          <p className="mt-2 text-xs text-[#9ca3af]">
            Agency users use the public safety portal; staff users use the admin console. Changing role is sensitive.
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <Row label="Full name" value={String(data.fullName || "—")} />
        <Row label="First name" value={String(data.firstName || "—")} />
        <Row label="Last name" value={String(data.lastName || "—")} />
        <Row label="Email" value={String(data.email ?? "")} />
        <Row label="Role" value={String(data.role ?? "")} />
        <Row label="Active" value={data.isActive === false ? "No" : "Yes"} />
        <Row label="Onboarding complete" value={data.onboardingCompleted ? "Yes" : "No"} />
        <Row
          label="Signed up"
          value={data.createdAt ? new Date(String(data.createdAt)).toLocaleString() : "—"}
        />
        <Row label="Agency name" value={String(data.agencyName || org?.name || "—")} />
        <Row label="Agency location" value={String(org?.location || "—")} />
        <Row
          label="Agency types"
          value={org?.agencyTypes?.length ? org.agencyTypes.join(", ") : "—"}
        />
        <Row label="Applications (org)" value={String(data.applicationCount ?? 0)} />
        {settings && Object.keys(settings).length > 0 && (
          <div className="pt-2">
            <p className="mb-1 text-xs uppercase text-[#9ca3af]">Settings (JSON)</p>
            <pre className="max-h-48 overflow-auto rounded bg-[#f9fafb] p-3 text-xs text-[#374151]">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <AlertDialog open={confirmRole !== null} onOpenChange={(o) => !o && setConfirmRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change user role?</AlertDialogTitle>
            <AlertDialogDescription>
              This user will become <strong>{confirmRole}</strong>. They may need to sign out and back in for all areas
              of the product to respect the new role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#ef3e34] hover:bg-[#d63530]"
              onClick={() => confirmRole && roleMutation.mutate(confirmRole)}
            >
              Confirm change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
