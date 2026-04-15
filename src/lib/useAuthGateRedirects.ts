"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useAdminAuth } from "@/lib/AdminAuthContext";

/**
 * Sends already-signed-in users away from auth screens (login, signup, password flows, staff login).
 * Admin session wins if both were somehow present.
 */
export function useAuthGateRedirects() {
  const router = useRouter();
  const { isAuthenticated: agencyAuthed, user } = useAuth();
  const { isAuthenticated: adminAuthed } = useAdminAuth();

  useEffect(() => {
    if (adminAuthed) {
      router.replace("/admin/dashboard");
      return;
    }
    if (agencyAuthed && user) {
      router.replace(user.onboardingCompleted ? "/dashboard" : "/onboarding");
    }
  }, [adminAuthed, agencyAuthed, user, router]);
}
