"use client";

import React, { useMemo } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { SaleForm } from "./SaleForm";
import { useCreateSale, useUpdateSale } from "../hooks/useSales";
import { useMenuItems } from "@/features/menu/hooks/useMenuItems";
import { useIsMobile } from "@/hooks";
import { formatDateInput } from "@/utils/formatDate";
import type { CreateSalePayload, Sale } from "../types/sale.types";
import type { MenuItem } from "@/features/menu/types/menu.types";

interface SaleDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the drawer edits this sale instead of creating a new one. */
  sale?: Sale | null;
  /** When provided (and `sale` is not), pre-fills a NEW sale from a voice entry. */
  voiceDefaultValues?: Record<string, unknown> | null;
  /** Shown as a reviewable "You said: ..." note when voiceDefaultValues is present. */
  voiceTranscript?: string | null;
}

const SCHEMA_VALUE_TO_PAYMENT_MODE: Record<string, string> = {
  Cash: "cash",
  UPI: "upi",
  Card: "card",
  Credit: "credit",
};

function saleToDefaultValues(sale: Sale, menuItemsById: Map<string, MenuItem>) {
  return {
    date: formatDateInput(new Date(sale.date)),
    customerId: sale.customer._id,
    customerName: sale.customer.name ?? sale.customerName ?? "",
    customerPhone: sale.customer.phone ?? sale.customerPhone ?? "",
    customerAddress: sale.customer.address ?? sale.customerAddress ?? "",
    items: sale.items.map((item) => {
      const menuItem = item.menuItem ? menuItemsById.get(item.menuItem) : undefined;
      return {
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        halfPrice: menuItem?.halfPrice,
        portion: item.portion,
        isCustom: item.isCustom,
        menuItem: item.menuItem,
      };
    }),
    deliveryCharge: sale.deliveryCharge ?? 0,
    paymentMode: sale.paymentMode ? SCHEMA_VALUE_TO_PAYMENT_MODE[sale.paymentMode] ?? sale.paymentMode : "cash",
    paymentStatus: sale.paymentStatus,
    amountPaid: sale.amountPaid ?? 0,
    notes: sale.notes,
  };
}

// Voice extraction already returns fields close to SaleForm's shape (backend
// matches items to real menu prices/halfPrice), but numeric/null fields need
// light cleanup, and paymentStatus defaults if the model couldn't tell.
function voiceToDefaultValues(voice: Record<string, unknown>) {
  return {
    date: formatDateInput(new Date()),
    customerName: (voice.customerName as string) ?? "",
    customerPhone: (voice.customerPhone as string) ?? "",
    customerAddress: (voice.customerAddress as string) ?? "",
    items: Array.isArray(voice.items) ? voice.items : [],
    deliveryCharge: (voice.deliveryCharge as number) ?? 0,
    paymentMode: (voice.paymentMode as string) ?? "cash",
    paymentStatus: (voice.paymentStatus as "Paid" | "Unpaid" | "Partial") ?? "Paid",
    amountPaid: (voice.amountPaid as number) ?? 0,
    notes: (voice.notes as string) ?? undefined,
  };
}

export function SaleDrawer({ open, onClose, sale, voiceDefaultValues, voiceTranscript }: SaleDrawerProps) {
  const { mutateAsync: createSale, isPending: isCreating } = useCreateSale();
  const { mutateAsync: updateSale, isPending: isUpdating } = useUpdateSale();
  const isMobile = useIsMobile();

  const isEditMode = !!sale;
  const isVoiceDraft = !isEditMode && !!voiceDefaultValues;

  const { data: menuData, isLoading: menuLoading } = useMenuItems();

  const menuItemsById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    (menuData?.data ?? []).forEach((item) => map.set(item._id, item));
    return map;
  }, [menuData]);

  const handleSubmit = async (data: CreateSalePayload & { customerName?: string }) => {
    if (isEditMode && sale) {
      await updateSale({ id: sale._id, payload: data });
    } else {
      await createSale(data);
    }
    onClose();
  };

  const DrawerComponent = isMobile ? MobileBottomDrawer : Drawer;

  const readyToRenderForm = !isEditMode || !menuLoading;

  const defaultValues = sale
    ? saleToDefaultValues(sale, menuItemsById)
    : voiceDefaultValues
    ? voiceToDefaultValues(voiceDefaultValues)
    : undefined;

  return (
    <DrawerComponent
      open={open}
      onClose={onClose}
      title={isEditMode ? `Edit Sale — ${sale?.invoiceId}` : "Add New Sale"}
      subtitle={isEditMode ? "Update order / sales details" : "Enter order / sales details"}
    >
      {readyToRenderForm ? (
        <div className="flex flex-col gap-4">
          {isVoiceDraft && voiceTranscript && (
            <div className="glass-card p-3 text-[12px] text-[#6B5D50] flex flex-col gap-1">
              <span className="uppercase tracking-wide text-[10px] font-[600] text-[#9E8E80]">You said</span>
              <span className="italic">"{voiceTranscript}"</span>
              <span className="text-[11px] text-[#9E8E80] mt-1">
                Review the fields below before saving — voice entry isn't always perfect.
              </span>
            </div>
          )}
          <SaleForm
            key={sale?._id ?? (isVoiceDraft ? "voice" : "new")}
            onSubmit={handleSubmit as (data: unknown) => void}
            isSubmitting={isEditMode ? isUpdating : isCreating}
            onCancel={onClose}
            defaultValues={defaultValues}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center py-16 text-[13px] text-[#9E8E80]">
          Loading sale details...
        </div>
      )}
    </DrawerComponent>
  );
}