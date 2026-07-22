"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { LayoutDashboard, ShoppingBag, Receipt, Users, UtensilsCrossed } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";

const BOTTOM_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", adminOnly: true },
  { label: "Sales", icon: ShoppingBag, href: "/sales" },
  { label: "Expenses", icon: Receipt, href: "/expenditure" },
  { label: "Customers", icon: Users, href: "/customers", adminOnly: true },
  { label: "Menu", icon: UtensilsCrossed, href: "/menu", adminOnly: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isAdmin, isOwner } = useAuthContext();

  const visible = BOTTOM_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin || isOwner
  );

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[20]",
        "bg-white/80 backdrop-blur-xl border-t border-white/60",
        "flex items-center justify-around",
        "pb-[env(safe-area-inset-bottom)]"
      )}
      aria-label="Mobile navigation"
    >
      {visible.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-[3px] py-3 px-4 min-w-[52px] transition-all",
              isActive ? "text-[#4C9A6E]" : "text-[#9E8E80]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className={cn("text-[10px]", isActive ? "font-[600]" : "font-[400]")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}