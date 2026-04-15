"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import adminApi from "@/lib/adminApi";
import { AdminTableViewLink } from "@/components/admin/AdminTableViewLink";
import { TagSelect } from "@/components/admin/TagSelect";
import { EQUIPMENT_TAGS, FUNDER_FUNDING_CATEGORIES, FUNDER_AGENCY_TYPES } from "@/lib/adminConstants";
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

const EMPTY_FUNDER_FORM = {
  name: "",
  website: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  missionStatement: "",
  locationFocus: "",
  localMatchRequired: false,
  avgGrantMin: "",
  avgGrantMax: "",
  deadline: "",
  cyclesPerYear: "1",
  pastGrantsAwarded: "",
  notes: "",
  maxApplicationsAllowed: "5",
};

const parseMoney = (raw: string | undefined): number | undefined => {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
};

const isMoneyLike = (raw: string | undefined): boolean => {
  const s = String(raw ?? "").trim();
  if (!s) return false;
  // Allow: digits, spaces, commas, $, and a single decimal point.
  // Disallow letters/other symbols so "12abc" doesn't pass.
  if (/[^0-9,\s.$\-]/.test(s)) return false;
  // Must include at least one digit.
  return /\d/.test(s);
};

const parsePositiveIntStrict = (raw: string | undefined): number | undefined => {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  if (!/^\d+$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const parseDateInput = (raw: string | undefined): string | undefined => {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;

  // Accept ISO-like yyyy-mm-dd (native date input) or mm/dd/yyyy.
  const isoLike = /^\d{4}-\d{2}-\d{2}$/.test(s);
  const usLike = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);

  let d: Date | null = null;
  if (isoLike) {
    const dt = new Date(`${s}T00:00:00.000Z`);
    d = Number.isNaN(dt.getTime()) ? null : dt;
  } else if (usLike) {
    const mm = Number(usLike[1]);
    const dd = Number(usLike[2]);
    const yyyy = Number(usLike[3]);
    const dt = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0));
    // Basic range sanity check (Date will overflow silently otherwise).
    if (dt.getUTCFullYear() === yyyy && dt.getUTCMonth() === mm - 1 && dt.getUTCDate() === dd) {
      d = dt;
    }
  } else {
    const dt = new Date(s);
    d = Number.isNaN(dt.getTime()) ? null : dt;
  }

  return d ? d.toISOString() : undefined;
};

type FunderFormKey = keyof typeof EMPTY_FUNDER_FORM;
type FunderFormErrors = Partial<Record<FunderFormKey | "fundingCategories" | "agencyTypesFunded", string>>;

export default function AdminFundersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FUNDER_FORM);
  const [selectedFundingCategories, setSelectedFundingCategories] = useState<string[]>([]);
  const [selectedAgencyTypesFunded, setSelectedAgencyTypesFunded] = useState<string[]>([]);
  const [selectedEquipmentTags, setSelectedEquipmentTags] = useState<string[]>([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin", "funders", search],
    queryFn: async () => {
      const res = await adminApi.get("admin/funders", { params: { search, limit: 100 } });
      return res.data;
    },
  });

  const validate = (): FunderFormErrors => {
    const errors: FunderFormErrors = {};

    const name = form.name.trim();
    if (!name) errors.name = "Name is required";

    const website = form.website.trim();
    if (!website) errors.website = "Website is required";
    else if (!/^https?:\/\/.+/i.test(website)) errors.website = "Enter a valid URL (include https://)";

    const contactName = form.contactName.trim();
    if (!contactName) errors.contactName = "Contact name is required";

    const contactEmail = form.contactEmail.trim();
    if (!contactEmail) errors.contactEmail = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errors.contactEmail = "Enter a valid email address";

    const mission = form.missionStatement.trim();
    if (!mission) errors.missionStatement = "Mission statement is required";
    else if (mission.length < 20) errors.missionStatement = "Please write at least 20 characters";

    const locList = form.locationFocus
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (locList.length === 0) errors.locationFocus = "Add at least one location (comma-separated)";

    if (selectedFundingCategories.length === 0) errors.fundingCategories = "Select at least one funding category";
    if (selectedAgencyTypesFunded.length === 0) errors.agencyTypesFunded = "Select at least one agency type";

    const min = parseMoney(form.avgGrantMin);
    const max = parseMoney(form.avgGrantMax);
    if (!isMoneyLike(form.avgGrantMin)) errors.avgGrantMin = "Enter a valid minimum amount (e.g. $25,000)";
    else if (min === undefined) errors.avgGrantMin = "Enter a valid minimum amount";
    else if (min < 0) errors.avgGrantMin = "Minimum must be 0 or greater";
    if (!isMoneyLike(form.avgGrantMax)) errors.avgGrantMax = "Enter a valid maximum amount (e.g. $150,000)";
    else if (max === undefined) errors.avgGrantMax = "Enter a valid maximum amount";
    else if (max < 0) errors.avgGrantMax = "Maximum must be 0 or greater";
    if (min !== undefined && max !== undefined && min > max) errors.avgGrantMax = "Maximum must be greater than or equal to minimum";

    const cycles = parsePositiveIntStrict(form.cyclesPerYear);
    if (cycles === undefined || cycles < 1) errors.cyclesPerYear = "Cycles per year must be at least 1";

    const maxApps = parsePositiveIntStrict(form.maxApplicationsAllowed);
    if (maxApps === undefined || maxApps < 1) errors.maxApplicationsAllowed = "Max applications must be at least 1";

    if (form.deadline.trim() !== "" && !parseDateInput(form.deadline)) {
      errors.deadline = "Enter a valid date (mm/dd/yyyy)";
    }

    return errors;
  };

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const create = useMutation({
    mutationFn: async () => {
      await adminApi.post("admin/funders", {
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
        localMatchRequired: form.localMatchRequired,
        avgGrantMin: parseMoney(form.avgGrantMin),
        avgGrantMax: parseMoney(form.avgGrantMax),
        deadline: parseDateInput(form.deadline),
        cyclesPerYear: form.cyclesPerYear ? Number(form.cyclesPerYear) : 1,
        pastGrantsAwarded: form.pastGrantsAwarded,
        notes: form.notes,
        maxApplicationsAllowed: form.maxApplicationsAllowed ? Number(form.maxApplicationsAllowed) : 5,
      });
    },
    onSuccess: () => {
      setForm(EMPTY_FUNDER_FORM);
      setSelectedFundingCategories([]);
      setSelectedAgencyTypesFunded([]);
      setSelectedEquipmentTags([]);
      setAttemptedSubmit(false);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "funders"] });
      toast({ title: "Funder created successfully" });
    },
    onError: (err: unknown) => {
      const ax = err as AxiosError<{ message?: string; error?: string }>;
      const msg = ax.response?.data?.message || ax.response?.data?.error || ax.message || "Failed to create funder";
      toast({ title: "Could not create funder", description: String(msg), variant: "destructive" });
    },
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="[font-family:'Montserrat',Helvetica] text-2xl font-bold text-[#111827]">Funders</h1>
        <Button className="bg-[#ef3e34] hover:bg-[#d63530] text-white" onClick={() => setOpen(true)}>
          Add funder
        </Button>
      </div>
      <Input
        className="max-w-md border-[#e5e7eb]"
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white text-sm shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#f9fafb] text-[#6b7280]">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Grant range</th>
              <th className="p-3">Applications</th>
              <th className="p-3">Status</th>
              <th className="w-14 p-3 text-center" aria-label="View details" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r: Record<string, unknown>) => (
              <tr key={String(r._id)} className="border-t border-[#f0f0f0]">
                <td className="p-3 font-medium text-[#111827]">{String(r.name)}</td>
                <td className="p-3 text-[#6b7280]">
                  ${Number(r.avgGrantMin || 0).toLocaleString()} – $
                  {Number(r.avgGrantMax || 0).toLocaleString()}
                </td>
                <td className="p-3 text-[#6b7280]">
                  {String(r.currentApplicationCount ?? 0)} / {String(r.maxApplicationsAllowed ?? 5)}
                </td>
                <td className="p-3">
                  {r.isLocked ? (
                    <span className="text-xs font-medium text-red-600">Locked</span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">Open</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <AdminTableViewLink href={`/admin/funders/${r._id}`} label="View funder details" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            setForm(EMPTY_FUNDER_FORM);
            setSelectedFundingCategories([]);
            setSelectedAgencyTypesFunded([]);
            setSelectedEquipmentTags([]);
            setAttemptedSubmit(false);
          }
          setOpen(v);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New funder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {(
              [
                "name",
                "website",
                "contactName",
                "contactEmail",
                "contactPhone",
                "missionStatement",
                "locationFocus",
                "avgGrantMin",
                "avgGrantMax",
                "deadline",
                "cyclesPerYear",
                "pastGrantsAwarded",
                "notes",
                "maxApplicationsAllowed",
              ] as const
            ).map((key) => (
              <div key={key}>
                <Label className="capitalize text-xs">
                  {key === "website"
                    ? "Website (official funder page)"
                    : key.replace(/([A-Z])/g, " $1")}
                </Label>
                {key === "missionStatement" || key === "notes" || key === "pastGrantsAwarded" ? (
                  <Textarea
                    className="border-[#e5e7eb] text-sm"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                ) : (
                  <Input
                    className="border-[#e5e7eb] text-sm"
                    placeholder={
                      key === "avgGrantMin" || key === "avgGrantMax"
                        ? "$25,000"
                        : key === "deadline"
                          ? "mm/dd/yyyy"
                          : undefined
                    }
                    inputMode={
                      key === "cyclesPerYear" || key === "maxApplicationsAllowed"
                        ? "numeric"
                        : undefined
                    }
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                )}
                {attemptedSubmit && errors[key] ? (
                  <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
                ) : null}
              </div>
            ))}
            <TagSelect
              label="Funding categories"
              options={FUNDER_FUNDING_CATEGORIES}
              selected={selectedFundingCategories}
              onChange={setSelectedFundingCategories}
              allowCustom
            />
            {attemptedSubmit && errors.fundingCategories ? (
              <p className="-mt-1 text-xs text-red-600">{errors.fundingCategories}</p>
            ) : null}
            <TagSelect
              label="Agency types funded"
              options={FUNDER_AGENCY_TYPES}
              selected={selectedAgencyTypesFunded}
              onChange={setSelectedAgencyTypesFunded}
              allowCustom
            />
            {attemptedSubmit && errors.agencyTypesFunded ? (
              <p className="-mt-1 text-xs text-red-600">{errors.agencyTypesFunded}</p>
            ) : null}
            <TagSelect
              label="Equipment tags"
              options={EQUIPMENT_TAGS}
              selected={selectedEquipmentTags}
              onChange={setSelectedEquipmentTags}
              allowCustom
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#e5e7eb]"
                checked={form.localMatchRequired}
                onChange={(e) => setForm({ ...form, localMatchRequired: e.target.checked })}
              />
              Local match typically required for this funder’s grants
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#ef3e34] hover:bg-[#d63530]"
              onClick={() => {
                setAttemptedSubmit(true);
                if (!isValid) return;
                create.mutate();
              }}
              disabled={create.isPending || !isValid}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
