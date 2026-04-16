"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn } from "lucide-react";
import adminApi from "@/lib/adminApi";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { useAuthGateRedirects } from "@/lib/useAuthGateRedirects";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getAuthErrorMessage } from "@/lib/authErrors";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  useAuthGateRedirects();
  const { login } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminApi.post("admin/auth/login", {
        email: String(data.email).trim().toLowerCase(),
        password: data.password,
      });
      const { user, token } = res.data.data;
      login(user, token);
      window.location.assign("/admin/dashboard");
    } catch (e: unknown) {
      setError(getAuthErrorMessage(e, "Unable to sign in. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const field = (name: keyof FormValues) =>
    cn(
      "h-10 rounded-lg border-[#e5e7eb] [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] focus-visible:border-[#ef3e34] focus-visible:ring-1 focus-visible:ring-[#ef3e34]",
      errors[name] && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
    );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="relative hidden w-[42%] flex-shrink-0 overflow-hidden lg:block">
        <img
          src="/auth-background.png"
          alt="Red Dog Radios"
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch overflow-y-auto bg-white px-4 py-4 sm:px-8 sm:py-6">
        <div className="mx-auto flex min-h-full w-full max-w-[400px] flex-col items-start justify-center gap-5">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ef3e34] shadow-[0_4px_14px_-2px_rgba(239,62,52,0.45)] sm:h-14 sm:w-14 sm:rounded-[14px]">
              <span className="[font-family:'Oswald',Helvetica] text-xl font-bold tracking-[1px] text-white sm:text-2xl">
                RD
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-start">
              <span className="[font-family:'Oswald',Helvetica] text-lg font-bold leading-tight tracking-[0.5px] text-black sm:text-xl">
                RED DOG RADIOS
              </span>
              <span className="[font-family:'Montserrat',Helvetica] text-[10px] font-semibold uppercase leading-snug tracking-[0.85px] text-[#ef3e34] sm:text-[11px]">
                Staff sign in
              </span>
            </div>
          </div>

          <p className="[font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
            Agency members use the{" "}
            <Link href="/login" className="font-semibold text-[#ef3e34] no-underline hover:underline">
              main application login
            </Link>
            .
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-5 rounded-2xl border border-[#f0f0f0] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
            noValidate
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#fff1f0]">
                <LogIn size={16} className="text-[#ef3e34]" />
              </div>
              <div>
                <h2 className="[font-family:'Montserrat',Helvetica] text-[15px] font-bold leading-tight text-[#111827]">
                  Staff portal
                </h2>
                <p className="mt-0.5 text-xs font-normal text-[#9ca3af] [font-family:'Montserrat',Helvetica]">
                  Red Dog Radio administrators only
                </p>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 [font-family:'Montserrat',Helvetica]">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#374151]">
                Email
              </Label>
              <Input
                type="email"
                autoComplete="username"
                className={field("email")}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#374151]">
                Password
              </Label>
              <Input type="password" autoComplete="current-password" className={field("password")} {...register("password")} />
              {errors.password && (
                <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ef3e34] text-white transition-colors hover:bg-[#d63530] active:bg-[#c02c28] disabled:opacity-60 [font-family:'Montserrat',Helvetica] text-sm font-bold tracking-[0.3px]"
            >
              <LogIn size={16} className="text-white" />
              {loading ? "SIGNING IN…" : "SIGN IN"}
            </button>
          </form>

          <p className="w-full text-center text-xs font-normal text-[#9ca3af] [font-family:'Montserrat',Helvetica]">
            © 2026 Red Dog Radios · Grant Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
}
