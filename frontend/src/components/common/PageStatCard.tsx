"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/utils/cn";

interface PageStatCardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  deltaLabel?: string;
  isLoading?: boolean;
  accentColor?: string;
  className?: string;
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function PageStatCard({
  label,
  value,
  delta,
  deltaLabel = "vs last month",
  isLoading = false,
  accentColor = "#C8873A",
  className,
}: PageStatCardProps) {
  const isPositive = delta !== undefined && delta !== null && delta > 0;
  const isNegative = delta !== undefined && delta !== null && delta < 0;
  const hasDelta = delta !== undefined && delta !== null;

  return (
    <div
      className={cn(
        "glass-card p-4 flex flex-col gap-1.5 min-w-0 overflow-hidden relative",
        className
      )}
    >
      {/* Subtle accent glow safely clipped by overflow-hidden */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          borderRadius: "inherit",
          background: `radial-gradient(circle at top left, ${accentColor}, ${accentColor}00 70%)`,
        }}
      />

      {isLoading ? (
        <>
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-6 w-28 mt-1" />
          <SkeletonLine className="h-3 w-16 mt-0.5" />
        </>
      ) : (
        <>
          <p className="text-[11px] font-[600] uppercase tracking-wider text-text-tertiary relative z-10">
            {label}
          </p>
          <p className="font-mono text-[22px] font-[700] text-text-primary leading-tight tracking-tight relative z-10">
            {value}
          </p>
          {hasDelta && (
            <div className="flex items-center gap-1 relative z-10 flex-wrap">
              <span
                className={cn(
                  "flex items-center gap-[3px] text-[11px] font-[600] px-1.5 py-0.5 rounded-full",
                  isPositive && "text-[#4C9A6E] bg-[rgba(91,173,130,0.12)]",
                  isNegative && "text-[#C0524A] bg-[rgba(192,82,74,0.12)]",
                  !isPositive && !isNegative && "text-text-tertiary bg-[rgba(158,142,128,0.10)]"
                )}
              >
                {isPositive ? (
                  <TrendingUp size={11} />
                ) : isNegative ? (
                  <TrendingDown size={11} />
                ) : (
                  <Minus size={11} />
                )}
                {Math.abs(delta!).toFixed(1)}%
              </span>
              <span className="text-[10px] text-text-tertiary">{deltaLabel}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
