"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { NAV_ITEMS } from "@/constants/navigation";
import { useAuthContext } from "@/providers/AuthProvider";
import { generateInitials, stringToColor } from "@/utils/strings";
import { Badge } from "@/components/ui/Badge";

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, isOwner } = useAuthContext();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin || isOwner
  );

  return (
    <aside
      className="glass-sidebar hidden md:flex flex-col w-[220px] flex-shrink-0 sticky top-4 h-[calc(100vh-32px)] z-[10]"
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-white text-[14px]">🍛</span>
          </div>
          <div className="min-w-0">
            <p
              className="font-display text-[26px] leading-none truncate pb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Restro Rasoi
            </p>
            <p
              className="text-[11px] leading-[1.3] truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              Cloud Kitchen
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-4 mb-2" style={{ background: "var(--glass-border)" }} />

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-[2px] overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", isActive && "active")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User block */}
      {user && (
        <>
          <div className="h-px mx-4 mb-3" style={{ background: "var(--glass-border)" }} />
          <div className="px-4 pb-5 flex items-center gap-3 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-[600] flex-shrink-0"
              style={{ background: stringToColor(user.name), color: "var(--accent)" }}
            >
              {generateInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-[600] truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user.name}
              </p>
              <Badge variant={user.role as "owner" | "admin"} className="text-[10px] px-[6px] py-[1px] mt-[1px]">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
