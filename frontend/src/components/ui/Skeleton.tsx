import React from "react";
import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          className={i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-5 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton height={12} width={80} />
        <Skeleton height={36} width={36} className="rounded-[10px]" />
      </div>
      <Skeleton height={32} width={100} className="rounded-[8px]" />
      <Skeleton height={12} width={120} />
    </div>
  );
}

export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-[rgba(255,255,255,0.18)]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-[14px] py-[13px]">
          <Skeleton height={13} width={i === 0 ? 80 : i === cols - 1 ? 60 : 100} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  );
}
