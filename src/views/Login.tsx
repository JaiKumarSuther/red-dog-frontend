"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginFormValues } from "@/lib/validation-schemas";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useAuthGateRedirects } from "@/lib/useAuthGateRedirects";
import { RedDogLogo } from "@/components/RedDogLogo";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getAuthErrorMessage } from "@/lib/authErrors";

export const Login = () => {
  useAuthGateRedirects();
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [verifyGateEmail, setVerifyGateEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    setVerifyGateEmail(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: String(data.email).trim().toLowerCase(),
        password: data.password,
      });
      const { user, token } = res.data.data;
      login(user, token);
      // Full navigation so middleware receives cookies set above (client router transitions can omit them).
      const dest = user.onboardingCompleted ? "/dashboard" : "/onboarding";
      window.location.assign(dest);
    } catch (err: unknown) {
      const ax = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = ax.response?.status;
      const message = ax.response?.data?.message || "";

      if (status === 403 && message.toLowerCase().includes("verify")) {
        const email = String(data.email).trim().toLowerCase();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("rdg_pending_email", email);
        }
        setVerifyGateEmail(email);
        toast({
          title: "Your email is not verified yet",
          description: "Check your inbox for the verification code.",
        });
        return;
      }

      if (status === 401 || status === 400) {
        setError("password", {
          message: "Incorrect email or password.",
        });
        return;
      }

      const msg = getAuthErrorMessage(
        err,
        "Unable to sign in right now. Please try again in a moment."
      );
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = verifyGateEmail || getValues("email")?.trim().toLowerCase() || "";
    if (!email) {
      toast({
        title: "Email required",
        description: "Enter your email above, then try again.",
        variant: "destructive",
      });
      return;
    }
    setResendLoading(true);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("rdg_pending_email", email);
      }
      await api.post("/auth/resend-verification", { email });
      toast({
        title: "Code sent",
        description: "Check your email for a new verification code.",
      });
      router.push("/otp-verification");
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, "Could not resend the code. Try again.");
      toast({ title: "Could not resend", description: msg, variant: "destructive" });
    } finally {
      setResendLoading(false);
    }
  };

  const fieldBorder = (name: keyof LoginFormValues) =>
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
            <button
              type="button"
              className="flex-1 bg-white rounded-full py-2 px-4 flex items-center justify-center gap-1.5 shadow-sm border border-[#e5e7eb]"
              data-testid="tab-signin"
            >
              <LogIn size={13} className="text-[#374151]" />
              <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#111827] text-sm">
                Sign In
              </span>
            </button>
            <Link
              href="/signup"
              className="flex-1 rounded-full py-2 px-4 flex items-center justify-center gap-1.5 no-underline"
              data-testid="tab-signup"
            >
              <UserPlus size={13} className="text-[#9ca3af]" />
              <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#6b7280] text-sm">
                Sign Up
              </span>
            </Link>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-6 flex flex-col gap-5"
            noValidate
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#fff1f0] flex items-center justify-center flex-shrink-0">
                <LogIn size={16} className="text-[#ef3e34]" />
              </div>
              <div>
                <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111827] text-[15px] leading-tight">
                  Welcome Back
                </h2>
                <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-xs mt-0.5">
                  Sign in to access your dashboard
                </p>
              </div>
            </div>

            {apiError && (
              <p className="[font-family:'Montserrat',Helvetica] text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {apiError}
              </p>
            )}

            {verifyGateEmail && (
              <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 [font-family:'Montserrat',Helvetica] text-sm text-amber-900">
                <p className="font-medium">Finish verifying your email to sign in.</p>
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={() => void handleResendVerification()}
                  className="h-10 rounded-lg bg-[#ef3e34] px-3 text-sm font-bold text-white transition-colors hover:bg-[#d63530] disabled:opacity-60"
                >
                  {resendLoading ? "Sending…" : "Resend verification code"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/otp-verification")}
                  className="text-xs font-semibold text-[#ef3e34] underline-offset-2 hover:underline"
                >
                  I already have a code — enter it
                </button>
              </div>
            )}

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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-testid="input-password"
                  className={cn(fieldBorder("password"), "pr-10")}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.password.message}</p>
              )}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="[font-family:'Montserrat',Helvetica] text-xs font-medium text-[#ef3e34] hover:underline no-underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="button-signin"
              className="w-full h-11 bg-[#ef3e34] hover:bg-[#d63530] active:bg-[#c02c28] text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <LogIn size={16} className="text-white" />
              <span className="[font-family:'Montserrat',Helvetica] font-bold text-sm tracking-[0.3px]">
                {loading ? "SIGNING IN..." : "SIGN IN TO ACCOUNT"}
              </span>
            </button>

            <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#9ca3af] text-[10px] text-center leading-4">
              By continuing, you agree to the Red Dog Radios platform terms of service.
            </p>
          </form>
          <p className="mt-5 w-full text-center [font-family:'Montserrat',Helvetica] text-xs font-normal text-[#9ca3af] sm:mt-6">
            © 2026 Red Dog Radios · Grant Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
};
