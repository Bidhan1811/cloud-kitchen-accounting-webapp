"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
  onAddSale?: () => void;
}

export function AppShell({ children, onAddSale }: AppShellProps) {
  return (
    <div className="relative z-[2] flex h-screen p-4 gap-3 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content panel */}
      <main
        className="glass flex-1 overflow-y-auto h-full min-w-0"
        id="main-content"
      >
        <div className="px-8 py-7 pb-24 md:pb-7">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav onAddSale={onAddSale} />
    </div>
  );
}
