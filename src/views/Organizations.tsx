"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, MapPin, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { organizationFormSchema, type OrganizationFormValues } from "@/lib/validation-schemas";
import api from "@/lib/api";
import { qk } from "@/lib/queryKeys";

type Org = {
  id: string;
  name: string;
  website: string;
  location: string;
  focusAreas: string[];
  extraAreas: number;
  matches: number;
  status: string;
};

type ApiOrg = {
  _id: string;
  name: string;
  website?: string;
  websiteUrl?: string;
  location?: string;
  focusAreas?: string[];
  programAreas?: string[];
  matchCount?: number;
  status?: string;
};

const mapOrg = (o: ApiOrg): Org => {
  const areas = o.focusAreas ?? o.programAreas ?? [];
  return {
    id: o._id,
    name: o.name,
    website: o.website ?? o.websiteUrl ?? "Website",
    location: o.location ?? "—",
    focusAreas: areas.slice(0, 2),
    extraAreas: Math.max(0, areas.length - 2),
    matches: o.matchCount ?? 0,
    status: o.status ?? "active",
  };
};

interface AddOrgModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddOrganizationModal = ({ onClose, onSuccess }: AddOrgModalProps) => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: { name: "", location: "", website: "", mission: "", focusAreas: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: OrganizationFormValues) => {
      const areas = data.focusAreas.split(",").map((s) => s.trim()).filter(Boolean);
      return api.post("/organizations", {
        name: data.name.trim(),
        location: data.location.trim(),
        website: data.website.trim() || undefined,
        missionStatement: data.mission.trim() || undefined,
        focusAreas: areas,
        status: "active",
      });
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Organization created successfully", description: `${variables.name.trim()} has been added.` });
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create organization.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const inputClass = (name: keyof OrganizationFormValues) =>
    cn(
      "h-10 border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34]",
      errors[name] && "border-red-500 focus-visible:ring-red-500"
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] w-full max-w-[520px] mx-4 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-[#f3f4f6]">
          <h2 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl tracking-[0.5px] uppercase">Add Organization</h2>
          <button type="button" onClick={onClose} data-testid="button-close-modal"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
            <X size={14} className="text-[#6b7280]" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="flex flex-col" noValidate>
          <div className="px-7 py-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">Organization Name</Label>
              <Input placeholder="e.g. Red Dog" data-testid="input-org-name" className={inputClass("name")} {...register("name")} />
              {errors.name && <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">Location</Label>
                <Input placeholder="e.g. Seattle, WA" data-testid="input-org-location" className={inputClass("location")} {...register("location")} />
                {errors.location && <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.location.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">Website URL</Label>
                <Input placeholder="https://" type="url" data-testid="input-org-website" className={inputClass("website")} {...register("website")} />
                {errors.website && <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.website.message}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">Mission Statement</Label>
              <Textarea placeholder="Organization's core mission.." rows={4} data-testid="textarea-org-mission"
                className={cn(
                  "border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34] resize-none",
                  errors.mission && "border-red-500 focus-visible:ring-red-500"
                )}
                {...register("mission")}
              />
              {errors.mission && <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.mission.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">Focus Areas</Label>
              <Input placeholder="Climate, Education, Arts" data-testid="input-org-focus-areas" className={inputClass("focusAreas")} {...register("focusAreas")} />
              {errors.focusAreas && <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.focusAreas.message}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#f3f4f6] px-7 py-5 sm:flex-row sm:justify-end sm:gap-3">
            <button type="button" onClick={onClose} data-testid="button-cancel-org"
              className="px-4 py-2 [font-family:'Montserrat',Helvetica] text-sm font-medium text-[#6b7280] transition-colors hover:text-[#374151]">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} data-testid="button-create-org"
              className="h-10 rounded-lg bg-[#ef3e34] px-5 text-white [font-family:'Montserrat',Helvetica] text-sm font-semibold transition-colors hover:bg-[#d63530] active:bg-[#c02c28] disabled:opacity-60">
              {createMutation.isPending ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Organizations = () => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: orgs = [], isLoading: loading } = useQuery<Org[]>({
    queryKey: qk.organizations(),
    queryFn: async () => {
      const res = await api.get("/organizations", { params: { limit: 100 } });
      const raw: ApiOrg[] = res.data.data ?? [];
      return raw.map(mapOrg);
    },
  });

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: qk.organizations() });
    setShowModal(false);
  };

  return (
    <>
      <div className="flex min-h-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 sm:p-6 lg:p-8">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex flex-col gap-1">
            <h1 className="[font-family:'Oswald',Helvetica] text-2xl font-bold uppercase leading-tight tracking-[0.5px] text-black sm:text-3xl break-words">
              Organizations
            </h1>
            <p className="[font-family:'Montserrat',Helvetica] text-sm font-normal text-[#6b7280] max-w-prose break-words">
              Manage partner organizations and their focus profiles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            data-testid="button-add-organization"
            aria-label="Add organization"
            className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#ef3e34] px-3 text-white transition-colors hover:bg-[#d63530] active:bg-[#c02c28] sm:px-4"
          >
            <Plus size={16} className="shrink-0" />
            <span className="[font-family:'Montserrat',Helvetica] hidden text-sm font-semibold sm:inline">Add Organization</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#f0f0f0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-[#f3f4f6]">
            <div className="relative max-w-full sm:max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organizations..."
                data-testid="input-search-organizations"
                className="pl-8 h-9 border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#9ca3af] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34]" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="[font-family:'Montserrat',Helvetica] text-sm text-[#9ca3af]">Loading organizations...</span>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-[#f3f4f6]">
                      {["Organization", "Location", "Focus Areas", "Matches (High Fit)", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left lg:px-5">
                          <span className="[font-family:'Montserrat',Helvetica] text-xs font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">
                            {h}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((org, idx) => (
                      <tr
                        key={org.id}
                        data-testid={`row-org-${org.id}`}
                        className={`cursor-pointer border-b border-[#f9fafb] transition-colors hover:bg-[#fafafa] ${idx === filtered.length - 1 ? "border-b-0" : ""}`}
                      >
                        <td className="px-4 py-4 lg:px-5">
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold break-words text-[#111827]">{org.name}</span>
                            <span className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#ef3e34] break-all">
                              {org.website}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 lg:px-5">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="shrink-0 text-[#9ca3af]" />
                            <span className="[font-family:'Montserrat',Helvetica] text-sm font-normal break-words text-[#374151]">{org.location}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 lg:px-5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {org.focusAreas.map((area) => (
                              <span key={area} className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-normal text-[#374151]">
                                {area}
                              </span>
                            ))}
                            {org.extraAreas > 0 && (
                              <span className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-normal text-[#374151]">
                                +{org.extraAreas}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 lg:px-5">
                          <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827]">{org.matches} matches</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 lg:px-5">
                          <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-3 py-1 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#16a34a]">
                            {org.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="m-0 flex list-none flex-col divide-y divide-[#f9fafb] p-0 md:hidden">
                {filtered.map((org) => (
                  <li key={org.id} data-testid={`row-org-${org.id}`} className="cursor-pointer p-4 transition-colors hover:bg-[#fafafa]">
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0">
                        <p className="[font-family:'Montserrat',Helvetica] text-sm font-semibold break-words text-[#111827]">{org.name}</p>
                        <span className="mt-0.5 [font-family:'Montserrat',Helvetica] text-xs font-medium text-[#ef3e34] break-all">
                          {org.website}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin size={12} className="mt-0.5 shrink-0 text-[#9ca3af]" />
                        <span className="[font-family:'Montserrat',Helvetica] text-sm font-normal break-words text-[#374151]">{org.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {org.focusAreas.map((area) => (
                          <span key={area} className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-normal text-[#374151]">
                            {area}
                          </span>
                        ))}
                        {org.extraAreas > 0 && (
                          <span className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-normal text-[#374151]">
                            +{org.extraAreas}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827]">{org.matches} matches</span>
                        <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-3 py-1 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#16a34a]">
                          {org.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {showModal && <AddOrganizationModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
    </>
  );
};
