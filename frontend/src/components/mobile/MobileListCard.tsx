import React from "react";
import { cn } from "@/utils/cn";
import { ChevronRight } from "lucide-react";

interface MobileListCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode; // e.g. icon or image
  trailing?: React.ReactNode; // e.g. amount or badge
  onClick?: () => void;
  className?: string;
  /** Show a chevron arrow on the right indicating tappability */
  showChevron?: boolean;
}

export function MobileListCard({
  title,
  subtitle,
  avatar,
  trailing,
  onClick,
  className,
  showChevron = false,
}: MobileListCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl p-4",
        "flex items-center gap-3 shadow-sm",
        onClick && "cursor-pointer active:scale-[0.985] transition-transform hover:bg-white/75",
        className
      )}
    >
      {avatar && <div className="flex-shrink-0">{avatar}</div>}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-text-primary truncate leading-snug">
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] text-text-tertiary mt-[3px] truncate leading-snug">
            {subtitle}
          </div>
        )}
      </div>
      {trailing && (
        <div className="flex-shrink-0 flex flex-col items-end text-right gap-1">
          {trailing}
        </div>
      )}
      {showChevron && !trailing && (
        <ChevronRight size={16} className="text-text-tertiary flex-shrink-0" />
      )}
    </div>
  );
}
