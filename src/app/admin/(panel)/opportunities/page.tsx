"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";
import { TagSelect, CategorySelect } from "@/components/admin/TagSelect";
import { EQUIPMENT_TAGS, FUNDING_CATEGORIES } from "@/lib/adminConstants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type OpportunityRow = {
  _id: string;
  title: string;
  funder: string;
  deadline?: string;
  status: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  keywords?: string[];
  sourceUrl?: string;
  description?: string;
  agenciesMatchedCount?: number;
  applicationCount?: number;
  highestMatchScore?: number;
};

type FunderOption = { _id: string; name: string };

const emptyCreateForm = {
  title: "",
  funderId: "",
  deadline: "",
  minAmount: "",
  maxAmount: "",
  sourceUrl: "",
  keywords: "",
  description: "",
  localMatchRequired: false,
};

const parseMoney = (raw: string | undefined): number | undefined => {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  // Accept values like "$50,000" / "50,000" / "50000"
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
};

export default function AdminOpportunitiesPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(emptyCreateForm);
  const [selectedEquipmentTags, setSelectedEquipmentTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data, refetch } = useQuery({
    queryKey: ["admin", "opportunities", statusFilter],
    queryFn: async () => {
      const res = await adminApi.get("admin/opportunities", {
        params: { limit: 50, status: statusFilter || undefined },
      });
      return res.data;
    },
  });

  const { data: fundersRes, isLoading: fundersLoading } = useQuery({
    queryKey: ["admin", "funders", "opportunity-create"],
    queryFn: async () => {
      const res = await adminApi.get("admin/funders", { params: { limit: 500 } });
      return res.data.data as FunderOption[];
    },
    enabled: open,
    staleTime: 60_000,
  });

  const funders = fundersRes ?? [];

  const create = useMutation({
    mutationFn: async () => {
      const selected = funders.find((f) => String(f._id) === form.funderId);
      if (!selected?.name) {
        throw new Error("Please select a funder from the list.");
      }
      await adminApi.post("admin/opportunities", {
        title: form.title,
        funder: selected.name,
        deadline: form.deadline || undefined,
        minAmount: parseMoney(form.minAmount),
        maxAmount: parseMoney(form.maxAmount),
        sourceUrl: form.sourceUrl,
        keywords: form.keywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        equipmentTags: selectedEquipmentTags,
        category: selectedCategory,
        description: form.description,
        localMatchRequired: form.localMatchRequired,
      });
    },
    onSuccess: () => {
      setForm(emptyCreateForm);
      setSelectedEquipmentTags([]);
      setSelectedCategory("");
      setOpen(false);
      refetch();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not create opportunity.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const rows = (data?.data ?? []) as OpportunityRow[];
  const now = Date.now();
  const in14 = 14 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Opportunities</h1>
        <Button
          className="bg-[#ef3e34] hover:bg-[#d63530] text-white"
          onClick={() => {
            setForm(emptyCreateForm);
            setSelectedEquipmentTags([]);
            setSelectedCategory("");
            setOpen(true);
          }}
        >
          Add opportunity
        </Button>
      </div>
      <div className="flex gap-2">
        <select
          className="rounded border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closing">Closing</option>
          <option value="closed">Closed</option>
        </select>
        <Button variant="secondary" type="button" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#f9fafb] text-left text-[#6b7280]">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Funder</th>
              <th className="p-3">Deadline</th>
              <th className="p-3">Status</th>
              <th className="w-14 p-3 text-center" aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dl = r.deadline ? new Date(String(r.deadline)).getTime() : null;
              const urgent = dl && dl - now < in14 && dl > now;
              return (
                <tr key={String(r._id)} className="border-t border-[#f0f0f0]">
                  <td className="max-w-[220px] p-3 font-medium text-[#111827]">
                    <span className="line-clamp-2" title={r.title}>
                      {r.title}
                    </span>
                  </td>
                  <td className="p-3 text-[#6b7280]">{r.funder}</td>
                  <td className={`whitespace-nowrap p-3 ${urgent ? "font-medium text-[#ef3e34]" : "text-[#6b7280]"}`}>
                    {r.deadline ? new Date(String(r.deadline)).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 text-[#6b7280]">{r.status}</td>
                  <td className="p-3 text-center">
                    <AdminTableViewLink href={`/admin/opportunities/${r._id}`} label="View opportunity details" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setForm(emptyCreateForm);
            setSelectedEquipmentTags([]);
            setSelectedCategory("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New opportunity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Title</Label>
              <Input
                className="border-[#e5e7eb]"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Funder</Label>
              {fundersLoading ? (
                <p className="mt-1 text-sm text-[#6b7280]">Loading funders…</p>
              ) : funders.length === 0 ? (
                <p className="mt-1 text-sm text-amber-700">
                  No funders found. Add funders under{" "}
                  <span className="font-medium">Funders</span> first.
                </p>
              ) : (
                <select
                  className="mt-1 w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827]"
                  value={form.funderId}
                  onChange={(e) => setForm({ ...form, funderId: e.target.value })}
                  required
                >
                  <option value="">Select a funder…</option>
                  {funders.map((f) => (
                    <option key={String(f._id)} value={String(f._id)}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                className="border-[#e5e7eb]"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Min amount</Label>
                <Input
                  className="border-[#e5e7eb]"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                />
              </div>
              <div>
                <Label>Max amount</Label>
                <Input
                  className="border-[#e5e7eb]"
                  value={form.maxAmount}
                  onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Official opportunity link</Label>
              <Input
                className="border-[#e5e7eb]"
                placeholder="https://…"
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              />
            </div>
            <TagSelect
              label="Equipment tags"
              options={EQUIPMENT_TAGS}
              selected={selectedEquipmentTags}
              onChange={setSelectedEquipmentTags}
              allowCustom
            />
            <div>
              <Label>Keywords (comma separated)</Label>
              <Input
                className="border-[#e5e7eb]"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
            </div>
            <CategorySelect
              label="Category"
              options={FUNDING_CATEGORIES}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
            <div>
              <Label>Description</Label>
              <Textarea
                className="border-[#e5e7eb]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#e5e7eb]"
                checked={form.localMatchRequired}
                onChange={(e) => setForm({ ...form, localMatchRequired: e.target.checked })}
              />
              Local match typically required for this grant
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setForm(emptyCreateForm);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ef3e34] hover:bg-[#d63530]"
              onClick={() => create.mutate()}
              disabled={
                create.isPending ||
                !form.title.trim() ||
                !form.funderId ||
                fundersLoading ||
                funders.length === 0
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
