"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { AddSaleProvider, useAddSale } from "@/providers/AddSaleProvider";
import { SaleDrawer } from "@/features/sales/components/SaleDrawer";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useAddSale();

  return (
    <div className="relative z-[2] flex h-screen p-0 md:p-4 md:gap-3 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content panel */}
      <main
        className="glass flex-1 overflow-y-auto h-full min-w-0 max-md:!rounded-none md:rounded-[inherit]"
        id="main-content"
      >
        {/* Mobile top safe area spacer */}
        <div className="h-[env(safe-area-inset-top)] md:hidden" />
        <div className="px-4 py-5 md:px-8 md:py-7 pb-[calc(90px+env(safe-area-inset-bottom))] md:pb-7">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Global Add Sale Drawer (triggered by FAB from any page) */}
      <SaleDrawer open={isOpen} onClose={close} />
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  /** @deprecated use AddSaleProvider context instead */
  onAddSale?: () => void;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <AddSaleProvider>
      <AppShellInner>{children}</AppShellInner>
    </AddSaleProvider>
  );
}
