"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import adminApi from "@/lib/adminApi";
import { useState, useEffect } from "react";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { TagSelect } from "@/components/admin/TagSelect";
import { EQUIPMENT_TAGS, FUNDER_FUNDING_CATEGORIES, FUNDER_AGENCY_TYPES } from "@/lib/adminConstants";
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

export default function EditFunderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedFundingCategories, setSelectedFundingCategories] = useState<string[]>([]);
  const [selectedAgencyTypesFunded, setSelectedAgencyTypesFunded] = useState<string[]>([]);
  const [selectedEquipmentTags, setSelectedEquipmentTags] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ["admin", "funder", id],
    queryFn: async () => {
      const res = await adminApi.get(`admin/funders/${id}`);
      return res.data.data as Record<string, unknown>;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!data) return;
    const d = data as Record<string, unknown>;
    setForm({
      name: String(d.name || ""),
      website: String(d.website || ""),
      contactName: String(d.contactName || ""),
      contactEmail: String(d.contactEmail || ""),
      contactPhone: String(d.contactPhone || ""),
      missionStatement: String(d.missionStatement || ""),
      locationFocus: Array.isArray(d.locationFocus) ? (d.locationFocus as string[]).join(", ") : "",
      localMatchRequired: d.localMatchRequired === true ? "yes" : "no",
      avgGrantMin: String(d.avgGrantMin ?? ""),
      avgGrantMax: String(d.avgGrantMax ?? ""),
      deadline: d.deadline ? String(d.deadline).slice(0, 10) : "",
      cyclesPerYear: String(d.cyclesPerYear ?? "1"),
      pastGrantsAwarded: Array.isArray(d.pastGrantsAwarded)
        ? (d.pastGrantsAwarded as string[]).join("\n")
        : "",
      notes: String(d.notes || ""),
      maxApplicationsAllowed: String(d.maxApplicationsAllowed ?? "5"),
    });
    setSelectedFundingCategories(Array.isArray(d.fundingCategories) ? (d.fundingCategories as string[]) : []);
    setSelectedAgencyTypesFunded(Array.isArray(d.agencyTypesFunded) ? (d.agencyTypesFunded as string[]) : []);
    setSelectedEquipmentTags(Array.isArray(d.equipmentTags) ? (d.equipmentTags as string[]) : []);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await adminApi.put(`admin/funders/${id}`, {
        name: form.name,
        website: form.website,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        missionStatement: form.missionStatement,
        locationFocus: form.locationFocus.split(",").map((s) => s.trim()).filter(Boolean),
        fundingCategories: selectedFundingCategories,
        agencyTypesFunded: selectedAgencyTypesFunded,
        equipmentTags: selectedEquipmentTags,
        localMatchRequired: form.localMatchRequired === "yes",
        avgGrantMin: parseMoney(form.avgGrantMin),
        avgGrantMax: parseMoney(form.avgGrantMax),
        deadline: form.deadline || undefined,
        cyclesPerYear: form.cyclesPerYear ? Number(form.cyclesPerYear) : 1,
        pastGrantsAwarded: form.pastGrantsAwarded,
        notes: form.notes,
        maxApplicationsAllowed: form.maxApplicationsAllowed
          ? Number(form.maxApplicationsAllowed)
          : 5,
      });
    },
    onSuccess: () => router.push("/admin/funders"),
  });

  if (!data) return <p className="text-[#6b7280]">Loading…</p>;

  return (
    <div className="max-w-xl space-y-3">
      <AdminBackLink href={`/admin/funders/${String(id)}`}>Back to funder</AdminBackLink>
      <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Edit funder</h1>
      {Object.keys(form).map((key) => (
        <div key={key}>
          <Label className="text-xs capitalize">
            {key === "localMatchRequired"
              ? "Local match required"
              : key === "website"
                ? "Website (official)"
                : key.replace(/([A-Z])/g, " $1")}
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
          ) : ["missionStatement", "notes", "pastGrantsAwarded"].includes(key) ? (
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
      <TagSelect
        label="Funding categories"
        options={FUNDER_FUNDING_CATEGORIES}
        selected={selectedFundingCategories}
        onChange={setSelectedFundingCategories}
        allowCustom
      />
      <TagSelect
        label="Agency types funded"
        options={FUNDER_AGENCY_TYPES}
        selected={selectedAgencyTypesFunded}
        onChange={setSelectedAgencyTypesFunded}
        allowCustom
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
