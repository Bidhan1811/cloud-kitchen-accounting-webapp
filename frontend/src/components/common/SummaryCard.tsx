"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg?: string;
  delta?: number;          // percent change e.g. 12.5 or -4.1
  deltaLabel?: string;     // e.g. "vs yesterday"
  isCurrency?: boolean;
  delay?: number;          // stagger delay ms
  className?: string;
}

function AnimatedNumber({ target, isCurrency }: { target: number; isCurrency: boolean }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(count, target, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplay(
          isCurrency ? formatCurrency(Math.round(v)) : Math.round(v).toLocaleString("en-IN")
        );
      },
    });
    return controls.stop;
  }, [target, isCurrency, count]);

  return <span>{display}</span>;
}

export function SummaryCard({
  title,
  value,
  icon,
  iconBg = "rgba(200,135,58,0.15)",
  delta,
  deltaLabel = "vs last month",
  isCurrency = true,
  delay = 0,
  className,
}: SummaryCardProps) {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;

  return (
    <motion.div
      className={cn("glass-card p-5 flex flex-col gap-3 min-w-0 flex-1", className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-[500] text-[#6B5D50] leading-[1.3]">{title}</p>
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>

      <p className="font-mono text-[30px] font-[600] text-[#1C1410] leading-[1.1] tracking-tight">
        <AnimatedNumber target={value} isCurrency={isCurrency} />
      </p>

      {delta !== undefined && (
        <div className="flex items-center gap-[5px]">
          <span
            className={cn(
              "flex items-center gap-[3px] text-[12px] font-[500]",
              isPositive && "text-[#4C9A6E]",
              isNegative && "text-[#C0524A]",
              !isPositive && !isNegative && "text-[#9E8E80]"
            )}
          >
            {isPositive ? <TrendingUp size={13} /> : isNegative ? <TrendingDown size={13} /> : <Minus size={13} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-[11px] text-[#9E8E80]">{deltaLabel}</span>
        </div>
      )}
    </motion.div>
  );
}
