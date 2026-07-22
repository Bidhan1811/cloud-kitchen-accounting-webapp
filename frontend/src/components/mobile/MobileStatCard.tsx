import React from "react";
import { cn } from "@/utils/cn";

interface MobileStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trendValue?: string;
  trendUp?: boolean;
  className?: string;
  /** If true, renders with a prominent colored background (e.g. Net Profit hero card) */
  hero?: boolean;
  heroColor?: string; // tailwind bg class or CSS var
}

export function MobileStatCard({
  label,
  value,
  icon: Icon,
  trendValue,
  trendUp,
  className,
  hero = false,
  heroColor,
}: MobileStatCardProps) {
  if (hero) {
    return (
      <div
        className={cn(
          "relative rounded-[20px] p-5 flex flex-col gap-2 overflow-hidden flex-shrink-0",
          className
        )}
        style={{ background: heroColor ?? "linear-gradient(135deg, #2E7D52 0%, #1B5E38 100%)" }}
      >
        {/* Decorative ring */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-10 w-36 h-36 rounded-full bg-white/5" />

        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Icon size={16} className="text-white" />
          </div>
          <p className="text-[13px] font-medium text-white/80">{label}</p>
        </div>

        <p className="text-[30px] font-bold text-white leading-tight font-jetbrains relative z-10">
          {value}
        </p>

        {trendValue && (
          <div className="flex items-center gap-1 relative z-10">
            <span className={cn("text-[12px] font-semibold", trendUp ? "text-green-300" : "text-red-300")}>
              {trendUp ? "↑" : "↓"} {trendValue}
            </span>
            <span className="text-[11px] text-white/60">vs last month</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card p-4 flex flex-col justify-between min-w-[140px] flex-1",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-accent-light/50 flex items-center justify-center text-accent">
          <Icon size={16} />
        </div>
        <p className="text-[13px] font-medium text-text-tertiary truncate">{label}</p>
      </div>
      <div className="mt-1">
        <p className="text-[22px] font-bold text-text-primary leading-tight font-jetbrains">
          {value}
        </p>
        {trendValue && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                "text-[12px] font-medium",
                trendUp ? "text-success" : "text-danger"
              )}
            >
              {trendUp ? "↑" : "↓"} {trendValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
