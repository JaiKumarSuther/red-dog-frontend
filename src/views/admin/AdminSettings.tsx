"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Mail, Zap, CheckCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SettingsSectionCard } from "@/components/settings/SettingsPrimitives";
import { adminSettingsSaveSchema, type AdminSettingsSaveFormValues } from "@/lib/validation-schemas";
import adminApi from "@/lib/adminApi";
import { useAdminAuth, type AdminUser } from "@/lib/AdminAuthContext";

type ApiSettings = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  role?: string;
  organizationId?: { name?: string } | null;
};

function toAdminUser(data: ApiSettings): AdminUser {
  return {
    _id: String(data._id ?? ""),
    email: String(data.email ?? ""),
    fullName: data.fullName,
    firstName: data.firstName,
    lastName: data.lastName,
    role: "admin",
  };
}

export function AdminSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, updateUser } = useAdminAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminSettingsSaveFormValues>({
    resolver: zodResolver(adminSettingsSaveSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const { data: settingsData } = useQuery<ApiSettings>({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await adminApi.get("settings");
      return res.data.data as ApiSettings;
    },
  });

  useEffect(() => {
    if (settingsData) {
      const u = settingsData;
      reset({
        firstName: u.firstName ?? (u.fullName ? u.fullName.split(" ")[0] : "") ?? "",
        lastName: u.lastName ?? (u.fullName ? u.fullName.split(" ").slice(1).join(" ") : "") ?? "",
        email: u.email ?? "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else if (user) {
      reset({
        firstName: user.firstName ?? (user.fullName ? user.fullName.split(" ")[0] : "") ?? "",
        lastName: user.lastName ?? (user.fullName ? user.fullName.split(" ").slice(1).join(" ") : "") ?? "",
        email: user.email ?? "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [settingsData, user, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: AdminSettingsSaveFormValues) => {
      const body: Record<string, unknown> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };
      const np = data.newPassword?.trim() ?? "";
      if (np) {
        body.currentPassword = data.currentPassword;
        body.newPassword = np;
      }
      return adminApi.put("settings", body);
    },
    onSuccess: (res, variables) => {
      const raw = res.data?.data as ApiSettings | undefined;
      if (raw?._id) {
        updateUser(toAdminUser(raw));
      }
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      reset({
        ...variables,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Settings saved",
        description: "Your staff profile was updated.",
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save settings.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleSave = () => {
    void handleSubmit((data) => saveMutation.mutate(data))();
  };

  const inputCls =
    "w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm font-normal text-[#111827] placeholder:text-[#d1d5db] transition-colors focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20";
  const labelCls = "[font-family:'Montserrat',Helvetica] font-semibold text-[#9ca3af] text-xs tracking-[0.6px] uppercase";

  const displayName = user?.fullName ?? [user?.firstName, user?.lastName].filter(Boolean).join(" ") ?? "Staff";
  const displayEmail = user?.email ?? "";
  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "S";

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-6 bg-neutral-50 p-4 pb-10 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="[font-family:'Oswald',Helvetica] text-2xl font-bold uppercase leading-tight tracking-[0.5px] text-black sm:text-3xl">
              Settings
            </h1>
            <p className="[font-family:'Montserrat',Helvetica] text-sm font-normal text-[#6b7280]">
              Staff profile and security
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-admin-save-settings"
            className="flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#ef3e34] px-5 [font-family:'Montserrat',Helvetica] text-sm font-semibold text-white transition-colors hover:bg-[#d63530] disabled:opacity-60 sm:w-auto sm:justify-center"
          >
            <Zap size={14} />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <SettingsSectionCard
          icon={<span className="[font-family:'Montserrat',Helvetica] text-xs font-bold text-[#ef3e34]">A</span>}
          title="Profile"
          subtitle="Your staff identity and sign-in email"
        >
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#f0f0f0] bg-[#fafafa] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ef3e34]">
                <span className="[font-family:'Montserrat',Helvetica] text-sm font-bold text-white">{initials}</span>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="[font-family:'Montserrat',Helvetica] text-sm font-bold text-[#111827]">{displayName}</span>
                <span className="break-all [font-family:'Montserrat',Helvetica] text-xs font-normal text-[#9ca3af]">
                  {displayEmail}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#fff1f0] px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#ef3e34]">
                Staff portal
              </span>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 [font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#16a34a]">
                ✦ Active
              </span>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>First Name</label>
              <input
                data-testid="admin-input-first-name"
                className={cn(inputCls, errors.firstName && "border-red-500")}
                placeholder="First name"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.firstName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Last Name</label>
              <input
                data-testid="admin-input-last-name"
                className={cn(inputCls, errors.lastName && "border-red-500")}
                placeholder="Last name"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div className="mb-4 flex flex-col gap-1.5">
            <label className={labelCls}>Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input
                data-testid="admin-input-email"
                type="email"
                autoComplete="email"
                className={cn(inputCls, "pl-9", errors.email && "border-red-500")}
                placeholder="Email address"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Access</label>
            <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5">
              <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827]">
                Red Dog Radio — Administrator
              </span>
              <p className="mt-0.5 [font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">
                Full access to agencies, funders, opportunities, and user management
              </p>
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          icon={<Shield size={15} />}
          title="Security"
          subtitle="Authentication and password"
          iconBg="bg-[#fef3c7]"
          iconCls="text-[#d97706]"
        >
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3">
              <CheckCircle size={17} className="flex-shrink-0 text-[#16a34a]" />
              <div className="flex flex-col gap-0.5">
                <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827]">
                  Staff session active
                </span>
                <span className="[font-family:'Montserrat',Helvetica] text-xs font-normal text-[#9ca3af]">
                  JWT-secured access to admin APIs; sign out from the sidebar anytime
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
              <Lock size={17} className="flex-shrink-0 text-[#3b82f6]" />
              <div className="flex flex-col gap-0.5">
                <span className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827]">
                  Password changes
                </span>
                <span className="[font-family:'Montserrat',Helvetica] text-xs font-normal text-[#9ca3af]">
                  Use a strong unique password for staff accounts; rotate if shared credentials were exposed
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Current Password</label>
              <input
                data-testid="admin-input-current-password"
                type="password"
                autoComplete="current-password"
                className={cn(inputCls, errors.currentPassword && "border-red-500")}
                placeholder="Leave blank if not changing"
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>New Password</label>
              <input
                data-testid="admin-input-new-password"
                type="password"
                autoComplete="new-password"
                className={cn(inputCls, errors.newPassword && "border-red-500")}
                placeholder="Leave blank if not changing"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.newPassword.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelCls}>Confirm New Password</label>
              <input
                data-testid="admin-input-confirm-password"
                type="password"
                autoComplete="new-password"
                className={cn(inputCls, errors.confirmPassword && "border-red-500")}
                placeholder="Re-enter new password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </SettingsSectionCard>
      </div>
    </>
  );
}
