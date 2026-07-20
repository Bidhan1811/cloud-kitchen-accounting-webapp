"use client";

import React from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "paid" | "unpaid" | "active" | "inactive" | "owner" | "admin" | "pending" | "partial";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, string> = {
  paid: "badge-paid",
  unpaid: "badge-unpaid",
  active: "badge-active",
  inactive: "badge-inactive",
  owner: "badge-owner",
  admin: "bg-[rgba(100,80,200,0.12)] text-[#6450C8]",
  pending: "badge-pending",
  partial: "badge-pending",
};

const dotColorMap: Record<BadgeVariant, string> = {
  paid: "bg-[#4C9A6E]",
  unpaid: "bg-[#C0524A]",
  active: "bg-[#4C9A6E]",
  inactive: "bg-[#C0524A]",
  owner: "bg-[#C8873A]",
  admin: "bg-[#6450C8]",
  pending: "bg-[#B8862E]",
  partial: "bg-[#B8862E]",
};

export function Badge({ variant = "active", children, className, dot = false }: BadgeProps) {
  return (
    <span className={cn("badge", variantMap[variant], className)}>
      {dot && (
        <span className={cn("w-[6px] h-[6px] rounded-full", dotColorMap[variant])} />
      )}
      {children}
    </span>
  );
}

// Helper: map string status → badge variant
export function StatusBadge({ status }: { status?: string }) {
  if (!status) {
    return <Badge variant="inactive" dot>Unknown</Badge>;
  }

  const map: Record<string, BadgeVariant> = {
    paid: "paid",
    unpaid: "unpaid",
    partial: "partial",
    active: "active",
    inactive: "inactive",
    pending: "pending",
    owner: "owner",
    admin: "admin",
  };
  const variant = map[status.toLowerCase()] ?? "inactive";
  return (
    <Badge variant={variant} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
