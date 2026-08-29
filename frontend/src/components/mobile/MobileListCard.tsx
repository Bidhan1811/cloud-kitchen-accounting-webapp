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
  /** Optional action element to render below the main content */
  action?: React.ReactNode;
}

export function MobileListCard({
  title,
  subtitle,
  avatar,
  trailing,
  onClick,
  className,
  showChevron = false,
  action,
}: MobileListCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      style={onClick ? { willChange: "transform" } : undefined}
      className={cn(
        "glass-card px-4 py-3 flex flex-col",
        onClick && "cursor-pointer active:scale-[0.985] transition-transform",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {avatar && <div className="flex-shrink-0">{avatar}</div>}
        <div className="flex flex-col min-w-0 flex-1">
          <div
            className="text-[15px] font-semibold truncate leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              className="text-[12px] mt-[3px] truncate leading-snug"
              style={{ color: "var(--text-tertiary)" }}
            >
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
          <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} className="flex-shrink-0" />
        )}
      </div>
      {action && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: "1px solid var(--glass-border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {action}
        </div>
      )}
    </div>
  );
}
