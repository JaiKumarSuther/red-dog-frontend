"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedDogLogo } from "@/components/RedDogLogo";
import { AuthFooter } from "@/components/AuthFooter";
import { cn } from "@/lib/utils";
import { createPasswordSchema, type CreatePasswordFormValues } from "@/lib/validation-schemas";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthGateRedirects } from "@/lib/useAuthGateRedirects";

export const CreatePassword = () => {
  useAuthGateRedirects();
  const router = useRouter();
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePasswordFormValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: CreatePasswordFormValues) => {
    if (typeof window === "undefined") return;
    const email = sessionStorage.getItem("rdg_reset_email")?.trim() || "";
    const resetToken = sessionStorage.getItem("rdg_reset_token")?.trim() || "";
    if (!email || !resetToken) {
      toast({
        title: "Session expired",
        description: "Start again from forgot password.",
        variant: "destructive",
      });
      router.push("/forgot-password");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        resetToken,
        newPassword: data.newPassword,
      });
      sessionStorage.removeItem("rdg_reset_email");
      sessionStorage.removeItem("rdg_reset_token");
      toast({ title: "Password updated", description: "You can sign in with your new password." });
      router.push("/login");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not reset password.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const errBorder = (name: keyof CreatePasswordFormValues) =>
    errors[name] ? "border-red-500 focus-visible:ring-red-500" : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#f9fafb] px-4 pb-10 pt-6 sm:pt-8">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-10">
        <RedDogLogo />

        <div className="mt-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#fed7aa] bg-[#fff7ed]">
          <ShieldCheck size={28} className="text-[#f97316]" />
        </div>

        <h2 className="mt-5 [font-family:'Oswald',Helvetica] text-2xl font-bold tracking-[-0.5px] text-black">
          Create New Password
        </h2>
        <p className="mt-2 text-center [font-family:'Montserrat',Helvetica] text-sm font-normal text-[#6b7280]">
          Enter a new password for your account
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex w-full flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] text-sm font-medium text-black">New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                data-testid="input-new-password"
                className={cn(
                  "h-11 border-[#d1d5db] pr-10 [font-family:'Montserrat',Helvetica] text-sm focus-visible:ring-[#ef3e34]",
                  errBorder("newPassword")
                )}
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] text-sm font-medium text-black">Confirm Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                data-testid="input-confirm-password"
                className={cn(
                  "h-11 border-[#d1d5db] pr-10 [font-family:'Montserrat',Helvetica] text-sm focus-visible:ring-[#ef3e34]",
                  errBorder("confirmPassword")
                )}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#9ca3af]">Use at least 8 characters</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            data-testid="button-confirm-password"
            className="mt-1 h-11 w-full bg-[#ef3e34] text-white [font-family:'Montserrat',Helvetica] text-sm font-bold hover:bg-[#d63530]"
          >
            {loading ? "Saving…" : "CONFIRM PASSWORD"}
          </Button>
        </form>
      </div>

      <div className="mt-8">
        <AuthFooter />
      </div>
    </div>
  );
};
