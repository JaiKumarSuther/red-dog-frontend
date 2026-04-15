"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteAccountConfirmSchema, type DeleteAccountConfirmValues } from "@/lib/validation-schemas";

type DeleteAccountModalProps = {
  onClose: () => void;
  onConfirm: () => void;
  variant?: "agency" | "staff";
};

export function DeleteAccountModal({ onClose, onConfirm, variant = "agency" }: DeleteAccountModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteAccountConfirmValues>({
    resolver: zodResolver(deleteAccountConfirmSchema),
    defaultValues: { confirmation: "" },
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isStaff = variant === "staff";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-[520px] rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.22)]">
        <div className="flex justify-end px-5 pt-5">
          <button
            type="button"
            onClick={onClose}
            data-testid="button-close-delete-modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] transition-colors hover:bg-[#f3f4f6]"
          >
            <X size={14} className="text-[#6b7280]" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onConfirm)} className="flex flex-col gap-4 px-8 pb-6" noValidate>
          <h2 className="[font-family:'Oswald',Helvetica] text-xl font-bold uppercase leading-tight text-black">
            {isStaff ? "Deactivate your staff account?" : "Are you sure you want to delete your account"}
          </h2>
          <p className="[font-family:'Montserrat',Helvetica] text-sm font-normal leading-6 text-[#6b7280]">
            {isStaff
              ? "Your Red Dog Radio staff login will be deactivated. You will lose access to the admin portal until an administrator restores your account. Platform data for agencies is not deleted."
              : "This action is permanent – your account and all associated data will be permanently deleted and cannot be recovered."}
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="[font-family:'Montserrat',Helvetica] text-xs font-semibold text-[#374151]">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              data-testid="input-delete-confirm"
              autoComplete="off"
              placeholder="DELETE"
              className={cn(
                "w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 [font-family:'Montserrat',Helvetica] text-sm text-[#111827] placeholder:text-[#d1d5db] focus:border-[#ef3e34] focus:outline-none focus:ring-2 focus:ring-[#ef3e34]/20",
                errors.confirmation && "border-red-500"
              )}
              {...register("confirmation")}
            />
            {errors.confirmation && (
              <p className="text-xs text-red-600 [font-family:'Montserrat',Helvetica]">{errors.confirmation.message}</p>
            )}
          </div>
          <hr className="my-1 border-[#e5e7eb]" />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              data-testid="button-cancel-delete"
              className="h-11 rounded-lg border border-[#111827] px-6 [font-family:'Montserrat',Helvetica] text-sm font-semibold text-[#111827] transition-colors hover:bg-[#f9fafb]"
            >
              No, Go Back
            </button>
            <button
              type="submit"
              data-testid="button-confirm-delete"
              className="h-11 rounded-lg bg-[#ef3e34] px-6 text-white [font-family:'Montserrat',Helvetica] text-sm font-semibold transition-colors hover:bg-[#d63530]"
            >
              {isStaff ? "Yes, Deactivate Account" : "Yes, Delete My Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
