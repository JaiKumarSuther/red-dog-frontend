"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  href: string;
  children: React.ReactNode;
};

export function AdminBackLink({ href, children }: Props) {
  return (
    <Button variant="ghost" className="-ml-3 h-auto gap-2 px-3 py-2 text-[#374151] hover:text-[#111827]" asChild>
      <Link href={href}>
        <ArrowLeft className="h-4 w-4" />
        {children}
      </Link>
    </Button>
  );
}
