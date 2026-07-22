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
}

// SaleForm's paymentMode field uses lowercase values ("cash", "upi", "card",
// "credit"); Sale records store the capitalized schema value ("Cash", "UPI",
// "Card", "Credit"). Reverse the mapping used on submit so editing an
// existing sale pre-fills the right toggle.
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
    // SaleItem itself has no halfPrice — it's only ever known via the menu
    // item it came from. Join it back in here using the current menu data
    // so the Full/Half toggle is available when editing. If the item is
    // custom, or its menuItem was since deleted from the menu, no halfPrice
    // is available and the toggle simply won't show for that row (same as
    // a brand-new custom item would behave).
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

export function SaleDrawer({ open, onClose, sale }: SaleDrawerProps) {
  const { mutateAsync: createSale, isPending: isCreating } = useCreateSale();
  const { mutateAsync: updateSale, isPending: isUpdating } = useUpdateSale();
  const isMobile = useIsMobile();

  const isEditMode = !!sale;

  // Only needed in edit mode, to join halfPrice back onto existing line
  // items — but the hook itself is unconditional (rules of hooks), so we
  // just don't use its result on create.
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

  // react-hook-form only reads defaultValues at mount, so if we're editing
  // we hold off rendering SaleForm until menu items have loaded — otherwise
  // it would mount with halfPrice missing and the portion toggle wouldn't
  // show even though the data arrives a moment later.
  const readyToRenderForm = !isEditMode || !menuLoading;

  return (
    <DrawerComponent
      open={open}
      onClose={onClose}
      title={isEditMode ? `Edit Sale — ${sale?.invoiceId}` : "Add New Sale"}
      subtitle={isEditMode ? "Update order / sales details" : "Enter order / sales details"}
    >
      {readyToRenderForm ? (
        <SaleForm
          key={sale?._id ?? "new"}
          onSubmit={handleSubmit as (data: unknown) => void}
          isSubmitting={isEditMode ? isUpdating : isCreating}
          onCancel={onClose}
          defaultValues={sale ? saleToDefaultValues(sale, menuItemsById) : undefined}
        />
      ) : (
        <div className="flex items-center justify-center py-16 text-[13px] text-[#9E8E80]">
          Loading sale details...
        </div>
      )}
    </DrawerComponent>
  );
}