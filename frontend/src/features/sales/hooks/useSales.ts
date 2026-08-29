"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { salesService } from "../services/sales.service";
import type { PatchPaymentPayload } from "../services/sales.service";
import type { SaleFilters, CreateSalePayload } from "../types/sale.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useSales(filters: SaleFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.SALES(filters),
    queryFn: () => salesService.getAll(filters),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SALE(id),
    queryFn: () => salesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => salesService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      // Credit sales affect customer ledger balance — invalidate so credit
      // balance on customer list / detail refreshes immediately.
      qc.invalidateQueries({ queryKey: ["customers"] });
      // Also refresh the ledger pages so the new SALE transaction shows up.
      qc.invalidateQueries({ queryKey: ["ledger"] });
      toast.success("Sale recorded successfully! 🎉");
    },
    onError: () => toast.error("Failed to record sale. Please try again."),
  });
}

export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSalePayload> }) =>
      salesService.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SALE(id) });
      // Same as create — credit changes affect customer balance display.
      qc.invalidateQueries({ queryKey: ["customers"] });
      // Refresh ledger views for the same reason.
      qc.invalidateQueries({ queryKey: ["ledger"] });
      toast.success("Sale updated successfully!");
    },
    onError: () => toast.error("Failed to update sale."),
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Sale deleted.");
    },
    onError: () => toast.error("Failed to delete sale."),
  });
}

export function usePatchSalePayment(onSuccess?: (updatedSale: import("../types/sale.types").Sale) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchPaymentPayload }) =>
      salesService.patchPayment(id, payload),
    onSuccess: (updatedSale, { id }) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SALE(id) });
      toast.success("Payment updated!");
      onSuccess?.(updatedSale);
    },
    onError: () => toast.error("Failed to update payment."),
  });
}
