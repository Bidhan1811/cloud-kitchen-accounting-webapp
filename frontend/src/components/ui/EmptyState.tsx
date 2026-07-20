import React from "react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 px-8 text-center", className)}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-[rgba(200,135,58,0.10)] flex items-center justify-center text-[#C8873A] mb-1">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-[600] text-[#1C1410]">{title}</p>
      {description && (
        <p className="text-[13px] text-[#9E8E80] max-w-[280px]">{description}</p>
      )}
      {action && (
        <div className="mt-2">
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Unable to load data",
  description = "Something went wrong. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 px-8 text-center", className)}>
      <div className="w-14 h-14 rounded-full bg-[rgba(192,82,74,0.10)] flex items-center justify-center text-[#C0524A] text-2xl mb-1">
        ⚠️
      </div>
      <p className="text-[15px] font-[600] text-[#1C1410]">{title}</p>
      <p className="text-[13px] text-[#9E8E80] max-w-[280px]">{description}</p>
      {onRetry && (
        <div className="mt-2">
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
