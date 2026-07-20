"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { LayoutDashboard, ShoppingBag, Receipt, Users, UtensilsCrossed, Plus } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";

const BOTTOM_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", adminOnly: true },
  { label: "Sales", icon: ShoppingBag, href: "/sales" },
  { label: "Expenses", icon: Receipt, href: "/expenditure" },
  { label: "Customers", icon: Users, href: "/customers", adminOnly: true },
  { label: "Menu", icon: UtensilsCrossed, href: "/menu", adminOnly: true },
];

interface MobileNavProps {
  onAddSale?: () => void;
}

export function MobileNav({ onAddSale }: MobileNavProps) {
  const pathname = usePathname();
  const { isAdmin, isOwner } = useAuthContext();

  const visible = BOTTOM_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin || isOwner
  );

  // Split for FAB in middle
  const half = Math.floor(visible.length / 2);
  const left = visible.slice(0, half);
  const right = visible.slice(half);

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[20]",
        "glass-sidebar border-t border-[rgba(255,255,255,0.40)]",
        "rounded-t-[24px] px-2 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]",
        "flex items-center justify-around"
      )}
      aria-label="Mobile navigation"
    >
      {/* Left items */}
      {left.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-[3px] px-3 py-1 rounded-[12px] transition-all min-w-[52px]",
              isActive ? "text-[#C8873A]" : "text-[#9E8E80]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className={cn("text-[10px]", isActive ? "font-[600]" : "font-[400]")}>{item.label}</span>
          </Link>
        );
      })}

      {/* FAB — Add Sale */}
      <button
        onClick={onAddSale}
        className="w-14 h-14 rounded-full bg-[#C8873A] flex items-center justify-center shadow-[0_4px_20px_rgba(200,135,58,0.40)] transition-transform active:scale-95 -mt-5"
        aria-label="Add new sale"
      >
        <Plus size={24} className="text-white" strokeWidth={2.5} />
      </button>

      {/* Right items */}
      {right.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-[3px] px-3 py-1 rounded-[12px] transition-all min-w-[52px]",
              isActive ? "text-[#C8873A]" : "text-[#9E8E80]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className={cn("text-[10px]", isActive ? "font-[600]" : "font-[400]")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
