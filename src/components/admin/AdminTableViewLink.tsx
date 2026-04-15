"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

type Props = {
  href: string;
  label?: string;
};

export function AdminTableViewLink({ href, label = "View full details" }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#374151] shadow-sm hover:bg-[#f9fafb]"
      aria-label={label}
    >
      <Eye className="h-4 w-4" />
    </Link>
  );
}
