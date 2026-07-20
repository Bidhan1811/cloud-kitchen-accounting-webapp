"use client";

import React from "react";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 font-[500] transition-all duration-150 cursor-pointer select-none",
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
    fullWidth && "w-full",
    size === "sm" && "px-3 py-2 text-xs min-h-[36px] rounded-[12px]",
    size === "md" && "px-5 py-[10px] text-xs min-h-[44px] rounded-[16px]",
    size === "lg" && "px-6 py-3 text-sm min-h-[52px] rounded-[16px]",
    variant === "primary" && "btn-primary",
    variant === "secondary" && "btn-secondary",
    variant === "ghost" && "btn-ghost",
    variant === "danger" && "btn-danger",
    variant === "icon" && "btn-icon !p-0 !min-h-[34px] !w-[34px] !h-[34px] !rounded-[10px]",
    className
  );

  return (
    <button {...props} disabled={disabled || loading} className={base}>
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        leftIcon && <span>{leftIcon}</span>
      )}
      {variant !== "icon" && children}
      {variant === "icon" && !loading && children}
      {rightIcon && !loading && <span>{rightIcon}</span>}
    </button>
  );
}
