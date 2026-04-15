"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signUpSchema, type SignUpFormValues } from "@/lib/validation-schemas";
import api from "@/lib/api";
import { useAuthGateRedirects } from "@/lib/useAuthGateRedirects";
import { RedDogLogo } from "@/components/RedDogLogo";

export const SignUp = () => {
  useAuthGateRedirects();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setApiError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      const pendingEmail = (res.data?.data?.email as string | undefined) ?? data.email;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("rdg_pending_email", String(pendingEmail).trim().toLowerCase());
      }
      router.push("/otp-verification");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Registration failed. Please try again.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fieldBorder = (name: keyof SignUpFormValues) =>
    cn(
      "h-10 border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34]",
      errors[name] && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
    );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden lg:block lg:w-[42%] flex-shrink-0 relative overflow-hidden">
        <img
          src="/auth-background.png"
          alt="Red Dog Radios"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch overflow-y-auto bg-white px-4 py-4 sm:px-8 sm:py-6">
        <div className="mx-auto flex min-h-full w-full max-w-[400px] flex-col items-start justify-center gap-5">
          <RedDogLogo />

          <div className="w-full bg-[#f3f4f6] rounded-full p-1 flex gap-1">
            <Link
              href="/login"
              className="flex-1 rounded-full py-2 px-4 flex items-center justify-center gap-1.5 no-underline"
              data-testid="tab-signin"
            >
              <LogIn size={13} className="text-[#9ca3af]" />
              <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#6b7280] text-sm">
                Sign In
              </span>
            </Link>
            <button
              type="button"
              className="flex-1 bg-white rounded-full py-2 px-4 flex items-center justify-center gap-1.5 shadow-sm border border-[#e5e7eb]"
              data-testid="tab-signup"
            >
              <UserPlus size={13} className="text-[#374151]" />
              <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#111827] text-sm">
                Sign Up
              </span>
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-6 flex flex-col gap-5"
            noValidate
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#fff1f0] flex items-center justify-center flex-shrink-0">
                <UserPlus size={16} className="text-[#ef3e34]" />
              </div>
              <div>
                <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-[15px] leading-tight">
                  Create account
                </h2>
                <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs mt-0.5">
                  Sign up to access your dashboard
                </p>
              </div>
            </div>

            {apiError && (
              <p className="[font-family:'Montserrat',Helvetica] text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {apiError}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="[font-family:'Montserrat',Helvetica] font-medium text-xs text-[#374151]">
                Full Name
              </Label>
              <Input
                type="text"
                autoComplete="name"
                placeholder="name"
                data-testid="input-fullname"
                className={fieldBorder("fullName")}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="[font-family:'Montserrat',Helvetica] font-medium text-xs text-[#374151]">
                Email
              </Label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                data-testid="input-email"
                className={fieldBorder("email")}
                {...register("email")}
              />
              {errors.email && (
                <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="[font-family:'Montserrat',Helvetica] font-medium text-xs text-[#374151]">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  data-testid="input-password"
                  className={cn(fieldBorder("password"), "pr-10")}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.password.message}</p>
              )}
              <p className="[font-family:'Montserrat',Helvetica] text-xs text-[#6b7280]">
                Must be at least 8 characters long.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="button-signup"
              className="w-full h-11 bg-[#ef3e34] hover:bg-[#d63530] active:bg-[#c02c28] text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <LogIn size={16} className="text-white" />
              <span className="[font-family:'Montserrat',Helvetica] font-bold text-sm tracking-[0.3px]">
                {loading ? "CREATING ACCOUNT..." : "CREATE AN ACCOUNT"}
              </span>
            </button>
          </form>
          <p className="mt-5 w-full text-center [font-family:'Montserrat',Helvetica] text-xs font-normal text-[#9ca3af] sm:mt-6">
            © 2026 Red Dog Radios · Grant Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
};
