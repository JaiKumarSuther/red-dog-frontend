"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedDogLogo } from "@/components/RedDogLogo";
import { AuthFooter } from "@/components/AuthFooter";
import { cn } from "@/lib/utils";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation-schemas";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthGateRedirects } from "@/lib/useAuthGateRedirects";

export const ForgotPassword = () => {
  useAuthGateRedirects();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: data.email.trim() });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("rdg_reset_email", data.email.trim().toLowerCase());
      }
      toast({
        title: "Check your email",
        description: "If an account exists, we sent a 6-digit code.",
      });
      router.push("/otp-verification?flow=reset");
    } catch {
      toast({
        title: "Request failed",
        description: "Could not send reset code. Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#f9fafb] px-4 pb-10 pt-6 sm:pt-8">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-10">
        <RedDogLogo />

        <div className="mt-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#fed7aa] bg-[#fff7ed]">
          <KeyRound size={28} className="text-[#f97316]" />
        </div>

        <h2 className="mt-5 [font-family:'Oswald',Helvetica] text-2xl font-bold tracking-[-0.5px] text-black">
          Reset Password
        </h2>
        <p className="mt-2 text-center [font-family:'Montserrat',Helvetica] text-sm font-normal text-[#6b7280]">
          Enter your email address to recover your account
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex w-full flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] text-sm font-medium text-black">Email</Label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              data-testid="input-email"
              className={cn(
                "h-11 border-[#d1d5db] [font-family:'Montserrat',Helvetica] text-sm focus-visible:ring-[#ef3e34]",
                errors.email && "border-red-500 focus-visible:ring-red-500"
              )}
              {...register("email")}
            />
            {errors.email && (
              <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            data-testid="button-send-otp"
            className="h-11 w-full bg-[#ef3e34] text-white [font-family:'Montserrat',Helvetica] text-sm font-bold hover:bg-[#d63530]"
          >
            {loading ? "Sending…" : "SEND OTP"}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-[#6b7280] no-underline transition-colors [font-family:'Montserrat',Helvetica] text-sm font-medium hover:text-[#ef3e34]"
          >
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </form>
      </div>

      <div className="mt-8">
        <AuthFooter />
      </div>
    </div>
  );
};
