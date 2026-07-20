"use client";

import React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { SaleForm } from "./SaleForm";
import { useCreateSale } from "../hooks/useSales";
import type { CreateSalePayload } from "../types/sale.types";

interface SaleDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SaleDrawer({ open, onClose }: SaleDrawerProps) {
  const { mutateAsync, isPending } = useCreateSale();

  const handleSubmit = async (data: CreateSalePayload & { customerName?: string }) => {
    await mutateAsync(data);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add New Sale"
      subtitle="Enter order / sales details"
    >
      <SaleForm
        onSubmit={handleSubmit as (data: unknown) => void}
        isSubmitting={isPending}
        onCancel={onClose}
      />
    </Drawer>
  );
}
