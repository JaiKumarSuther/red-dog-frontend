"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { onboardingStep1Schema, type OnboardingStep1FormValues } from "@/lib/validation-schemas";
import { RedDogLogo } from "@/components/RedDogLogo";

export const OnboardingStep1 = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnboardingStep1FormValues>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: {
      organizationName: "",
      location: "",
      websiteUrl: "",
      missionStatement: "",
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem("rdg_onboarding_step1");
      if (saved) reset(JSON.parse(saved) as OnboardingStep1FormValues);
    } catch {}
  }, [reset]);

  const onSubmit = (data: OnboardingStep1FormValues) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rdg_onboarding_step1", JSON.stringify(data));
    }
    router.push("/onboarding/step2");
  };

  const border = (name: keyof OnboardingStep1FormValues) =>
    cn(
      errors[name] && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
    );

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-4 pb-12 pt-6 sm:pt-8">
      <div className="mb-8 self-start">
        <RedDogLogo />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-[520px] flex-col gap-6 rounded-2xl border border-[#f0f0f0] bg-white px-4 py-6 shadow-[0_4px_32px_rgba(0,0,0,0.10)] sm:px-8 sm:py-8"
        noValidate
      >
        <div className="flex flex-col gap-1">
          <h1 className="[font-family:'Oswald',Helvetica] font-bold text-black text-xl tracking-[0.5px] uppercase">
            Your Agency
          </h1>
          <p className="[font-family:'Montserrat',Helvetica] font-normal text-[#6b7280] text-sm">
            Tell us who you are so Ashleen can find the right grants.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Organization Name <span className="text-[#ef3e34]">*</span>
          </Label>
          <Input
            type="text"
            placeholder="e.g. Red Dog Radio"
            className={cn(
              "h-10 border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34]",
              border("organizationName")
            )}
            {...register("organizationName")}
          />
          {errors.organizationName && (
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.organizationName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
              Location <span className="text-[#ef3e34]">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. Seattle, WA"
              className={cn(
                "h-10 border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34]",
                border("location")
              )}
              {...register("location")}
            />
            {errors.location && (
              <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.location.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
              Website URL
            </Label>
            <Input
              type="url"
              placeholder="https://"
              className={cn(
                "h-10 border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34]",
                border("websiteUrl")
              )}
              {...register("websiteUrl")}
            />
            {errors.websiteUrl && (
              <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.websiteUrl.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#111827]">
            Mission Statement <span className="text-[#ef3e34]">*</span>
          </Label>
          <Textarea
            placeholder="Organization's core mission.."
            rows={4}
            className={cn(
              "border-[#e5e7eb] rounded-lg [font-family:'Montserrat',Helvetica] text-sm placeholder:text-[#d1d5db] focus-visible:ring-[#ef3e34] focus-visible:ring-1 focus-visible:border-[#ef3e34] resize-none",
              border("missionStatement")
            )}
            {...register("missionStatement")}
          />
          {errors.missionStatement && (
            <p className="[font-family:'Montserrat',Helvetica] text-xs text-red-600">{errors.missionStatement.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#6b7280] hover:text-[#374151] transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            data-testid="button-continue"
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#ef3e34] px-6 text-white transition-colors hover:bg-[#d63530] active:bg-[#c02c28] sm:w-auto"
          >
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-sm">Continue</span>
            <ChevronRight size={15} className="text-white" />
          </button>
        </div>
      </form>
    </div>
  );
};
