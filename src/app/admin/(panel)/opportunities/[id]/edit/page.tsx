"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { useState, useEffect } from "react";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { TagSelect, CategorySelect } from "@/components/admin/TagSelect";
import { EQUIPMENT_TAGS, FUNDING_CATEGORIES } from "@/lib/adminConstants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const parseMoney = (raw: string | undefined): number | undefined => {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
};

export default function EditOpportunityPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedEquipmentTags, setSelectedEquipmentTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data } = useQuery({
    queryKey: ["admin", "opportunity", id],
    queryFn: async () => {
      const res = await adminApi.get(`admin/opportunities/${id}`);
      return res.data.data as Record<string, unknown>;
    },
  });

  useEffect(() => {
    if (!data) return;
    const d = data as Record<string, unknown>;
    setForm({
      title: String(d.title || ""),
      funder: String(d.funder || ""),
      deadline: d.deadline ? String(d.deadline).slice(0, 10) : "",
      minAmount: String(d.minAmount ?? ""),
      maxAmount: String(d.maxAmount ?? ""),
      sourceUrl: String(d.sourceUrl || ""),
      keywords: Array.isArray(d.keywords) ? (d.keywords as string[]).join(", ") : "",
      description: String(d.description || ""),
      localMatchRequired: d.localMatchRequired === true ? "yes" : "no",
    });
    setSelectedEquipmentTags(Array.isArray(d.equipmentTags) ? (d.equipmentTags as string[]) : []);
    setSelectedCategory(String(d.category || ""));
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await adminApi.put(`admin/opportunities/${id}`, {
        title: form.title,
        funder: form.funder,
        deadline: form.deadline || undefined,
        minAmount: parseMoney(form.minAmount),
        maxAmount: parseMoney(form.maxAmount),
        sourceUrl: form.sourceUrl,
        keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
        equipmentTags: selectedEquipmentTags,
        category: selectedCategory,
        description: form.description,
        localMatchRequired: form.localMatchRequired === "yes",
      });
    },
    onSuccess: () => router.push("/admin/opportunities"),
  });

  if (!data) return <p className="text-[#6b7280]">Loading…</p>;

  return (
    <div className="max-w-xl space-y-4">
      <AdminBackLink href={`/admin/opportunities/${String(id)}`}>Back to opportunity</AdminBackLink>
      <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Edit opportunity</h1>
      {Object.keys(form).map((key) => (
        <div key={key}>
          <Label className="capitalize">
            {key === "sourceUrl"
              ? "Official opportunity link"
              : key === "localMatchRequired"
                ? "Local match required"
                : key}
          </Label>
          {key === "localMatchRequired" ? (
            <select
              className="mt-1 w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          ) : key === "description" ? (
            <Textarea
              className="mt-1 border-[#e5e7eb]"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ) : (
            <Input
              className="mt-1 border-[#e5e7eb]"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          )}
        </div>
      ))}
      <CategorySelect
        label="Category"
        options={FUNDING_CATEGORIES}
        value={selectedCategory}
        onChange={setSelectedCategory}
      />
      <TagSelect
        label="Equipment tags"
        options={EQUIPMENT_TAGS}
        selected={selectedEquipmentTags}
        onChange={setSelectedEquipmentTags}
        allowCustom
      />
      <Button className="bg-[#ef3e34] hover:bg-[#d63530] text-white" onClick={() => save.mutate()} disabled={save.isPending}>
        Save
      </Button>
    </div>
  );
}
