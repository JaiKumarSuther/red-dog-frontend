import React from "react";

type StatusVariant =
  | "approved"
  | "rejected"
  | "awarded"
  | "denied"
  | "submitted"
  | "draft"
  | "in_review"
  | "pending"
  | "active"
  | "inactive"
  | "sent"
  | "high"
  | "medium"
  | "low"
  | string;

const variantStyles: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  awarded: "bg-green-100 text-green-700",
  active: "bg-green-100 text-green-700",
  sent: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  denied: "bg-red-100 text-red-600",
  high: "bg-red-100 text-red-600",
  submitted: "bg-blue-100 text-blue-600",
  in_review: "bg-blue-100 text-blue-600",
  pending: "bg-yellow-100 text-yellow-700",
  medium: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-500",
  inactive: "bg-gray-100 text-gray-500",
  low: "bg-gray-100 text-gray-500",
};

const formatLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const StatusBadge = ({
  status,
  className = "",
}: {
  status: StatusVariant;
  className?: string;
}) => {
  const style = variantStyles[status] ?? "bg-gray-100 text-gray-500";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold [font-family:'Montserrat',Helvetica] ${style} ${className}`}
    >
      {formatLabel(status)}
    </span>
  );
};
