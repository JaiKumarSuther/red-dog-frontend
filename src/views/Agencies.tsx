"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy placeholder — agency users use /dashboard; admin agencies live under /admin/agencies */
export function Agencies() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center [font-family:'Montserrat',Helvetica] text-sm text-[#6b7280]">
      Redirecting…
    </div>
  );
}
