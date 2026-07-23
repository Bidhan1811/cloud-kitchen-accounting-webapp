import React from "react";
import { cn } from "@/utils/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4 mb-6", className)}>
      <div className="min-w-[200px] flex-1">
        <h1 className="font-display text-[28px] font-[600] text-[#1C1410] leading-[1.2]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[#9E8E80] mt-[3px]">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 mt-[2px]">{action}</div>}
    </div>
  );
}
