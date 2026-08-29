"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ledgerService } from "../services/ledger.service";
import type { CreatePaymentPayload, CreateAdjustmentPayload, LedgerApiError } from "../types/ledger.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useCustomerLedger(
  customerId: string,
  range?: { startDate?: string; endDate?: string },
  options?: { lazy?: boolean }
) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER_LEDGER(customerId, range),
    queryFn: () => ledgerService.getLedger(customerId, range),
    // `lazy: true` disables the automatic fetch-on-mount — used when this
    // hook is only meant to be triggered on demand via refetch() (e.g.
    // generating a statement on button click), rather than displayed
    // continuously on screen.
    enabled: !!customerId && !options?.lazy,
  });
}

export function useCustomerLedgerSummary(customerId: string, year: number, month: number) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER_LEDGER_SUMMARY(customerId, year, month),
    queryFn: () => ledgerService.getMonthlySummary(customerId, year, month),
    enabled: !!customerId,
  });
}

/**
 * Recording a payment invalidates a wide net: the ledger itself, the
 * customer profile (creditBalance shown in the header), and the customers
 * list (creditBalance shown per-row) — all three surfaces display the same
 * derived balance and would otherwise go stale after this mutation.
 */
export function useCreatePayment(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => ledgerService.createPayment(customerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers", customerId, "ledger"] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMER(customerId) });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Payment recorded!");
    },
    onError: (err: any) => {
      const apiError: LedgerApiError | undefined = err?.response?.data;
      if (apiError?.code === "DUPLICATE_PAYMENT_REFERENCE") {
        // Handled specially by the caller (PaymentForm) via error.response
        // inspection — don't show a generic toast for this one, the form
        // shows an inline "record anyway?" prompt instead.
        return;
      }
      toast.error(apiError?.message || "Failed to record payment.");
    },
  });
}

export function useDeletePayment(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) => ledgerService.deletePayment(transactionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers", customerId, "ledger"] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMER(customerId) });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Payment deleted and reversed.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete payment.");
    },
  });
}

export function useCreateAdjustment(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdjustmentPayload) =>
      ledgerService.createAdjustment(customerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers", customerId, "ledger"] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMER(customerId) });
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Adjustment recorded!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to record adjustment.");
    },
  });
}