"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [addSaleOpen, setAddSaleOpen] = useState(false);

  return (
    <AppShell onAddSale={() => setAddSaleOpen(true)}>
      {/* Pass addSaleOpen state via context or just children */}
      {children}
    </AppShell>
  );
}
