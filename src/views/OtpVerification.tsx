"use client";

import type { ClipboardEvent, KeyboardEvent } from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RedDogLogo } from "@/components/RedDogLogo";
import { AuthFooter } from "@/components/AuthFooter";
import { cn } from "@/lib/utils";
import { otpSchema } from "@/lib/validation-schemas";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthGateRedirects } from "@/lib/useAuthGateRedirects";
import { useAuth } from "@/lib/AuthContext";

export const OtpVerification = () => {
  useAuthGateRedirects();
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const pendingEmail =
    typeof window !== "undefined" ? sessionStorage.getItem("rdg_pending_email")?.trim() || "" : "";
  const resetEmail =
    typeof window !== "undefined" ? sessionStorage.getItem("rdg_reset_email")?.trim() || "" : "";
  const mode: "signup" | "reset" = pendingEmail ? "signup" : "reset";
  const email = (pendingEmail || resetEmail || "").trim().toLowerCase();

  const confirmOtp = async () => {
    const code = otp.join("");
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setOtpError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }
    setOtpError(null);

    if (!email) {
      setOtpError("Session expired. Please restart the flow.");
      return;
    }

    setVerifying(true);
    try {
      if (mode === "signup") {
        const res = await api.post("/auth/verify-email", { email: email.trim().toLowerCase(), otp: code });
        const { user, token } = res.data?.data as { user: unknown; token: unknown };
        if (!user || !token) throw new Error("missing auth");
        login(user as never, String(token));
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("rdg_pending_email");
        }
        router.push("/onboarding");
      } else {
        const res = await api.post("/auth/verify-otp", { email: email.trim().toLowerCase(), otp: code });
        const token = res.data?.data?.resetToken as string | undefined;
        if (!token) throw new Error("missing token");
        if (typeof window !== "undefined") {
          sessionStorage.setItem("rdg_reset_token", token);
          // keep rdg_reset_email until password set
        }
        router.push("/create-password");
      }
    } catch {
      setOtpError("Invalid or expired code.");
      toast({ title: "Verification failed", description: "Check the code and try again.", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({ title: "Session expired", description: "Please restart the flow.", variant: "destructive" });
      router.push(mode === "signup" ? "/signup" : "/forgot-password");
      return;
    }

    try {
      const endpoint = mode === "signup" ? "/auth/resend-verification" : "/auth/forgot-password";
      await api.post(endpoint, { email: email.trim().toLowerCase() });
      toast({ title: "New code sent!", description: "Check your email." });
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not resend code.";
      toast({ title: "Could not resend", description: msg, variant: "destructive" });
    }
  };

  const handleChange = (index: number, value: string) => {
    setOtpError(null);
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    setOtpError(null);
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? "";
    }
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#f9fafb] px-4 pb-10 pt-6 sm:pt-8">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-10">
        <RedDogLogo />

        <div className="mt-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#fed7aa] bg-[#fff7ed]">
          <ShieldCheck size={28} className="text-[#f97316]" />
        </div>

        <h2 className="mt-5 [font-family:'Oswald',Helvetica] text-2xl font-bold tracking-[-0.5px] text-black">
          {mode === "signup" ? "Verify your email" : "Enter reset code"}
        </h2>
        <p className="mt-2 text-center [font-family:'Montserrat',Helvetica] text-sm font-normal text-[#6b7280]">
          Enter the 6-digit code sent to {email ? <span className="font-semibold">{email}</span> : "your email"}
        </p>

        <div className="mt-8 flex max-w-full flex-wrap justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              data-testid={`input-otp-${i}`}
              className={cn(
                "h-11 w-10 rounded-lg border-2 border-[#d1d5db] text-center text-base font-bold text-black transition-colors [font-family:'Montserrat',Helvetica] focus:border-[#ef3e34] focus:outline-none sm:h-12 sm:w-12 sm:text-lg",
                otpError && "border-red-500 focus:border-red-500"
              )}
            />
          ))}
        </div>
        {otpError && (
          <p className="mt-2 text-center [font-family:'Montserrat',Helvetica] text-sm text-red-600">{otpError}</p>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendCooldown > 0}
            className="[font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#ef3e34] hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
          </button>
        </div>

        <div className="mt-6 w-full">
          <Button
            type="button"
            onClick={() => void confirmOtp()}
            disabled={verifying}
            data-testid="button-confirm-otp"
            className="h-11 w-full bg-[#ef3e34] text-white [font-family:'Montserrat',Helvetica] text-sm font-bold hover:bg-[#d63530]"
          >
            {verifying ? "Verifying…" : "CONFIRM OTP"}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <AuthFooter />
      </div>
    </div>
  );
};
