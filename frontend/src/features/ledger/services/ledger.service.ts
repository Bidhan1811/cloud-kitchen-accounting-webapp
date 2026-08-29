import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type {
  CustomerLedger,
  MonthlyLedgerSummary,
  CreatePaymentPayload,
  CreatePaymentResult,
  CreateAdjustmentPayload,
  LedgerTransaction,
} from "../types/ledger.types";

export const ledgerService = {
  getLedger: async (
    customerId: string,
    range?: { startDate?: string; endDate?: string }
  ): Promise<CustomerLedger> => {
    const params = new URLSearchParams();
    if (range?.startDate) params.append("startDate", range.startDate);
    if (range?.endDate) params.append("endDate", range.endDate);
    const qs = params.toString();
    const { data } = await apiClient.get<ApiResponse<CustomerLedger>>(
      `/customers/${customerId}/ledger${qs ? `?${qs}` : ""}`
    );
    return data.data;
  },

  getMonthlySummary: async (
    customerId: string,
    year: number,
    month: number
  ): Promise<MonthlyLedgerSummary> => {
    const { data } = await apiClient.get<ApiResponse<MonthlyLedgerSummary>>(
      `/customers/${customerId}/ledger/summary?year=${year}&month=${month}`
    );
    return data.data;
  },

  createPayment: async (
    customerId: string,
    payload: CreatePaymentPayload
  ): Promise<CreatePaymentResult> => {
    const { data } = await apiClient.post<ApiResponse<CreatePaymentResult>>(
      `/customers/${customerId}/ledger/payment`,
      payload
    );
    return data.data;
  },

  deletePayment: async (transactionId: string): Promise<LedgerTransaction> => {
    const { data } = await apiClient.delete<ApiResponse<LedgerTransaction>>(
      `/customers/ledger/payment/${transactionId}`
    );
    return data.data;
  },

  createAdjustment: async (
    customerId: string,
    payload: CreateAdjustmentPayload
  ): Promise<LedgerTransaction> => {
    const { data } = await apiClient.post<ApiResponse<LedgerTransaction>>(
      `/customers/${customerId}/ledger/adjustment`,
      payload
    );
    return data.data;
  },
};