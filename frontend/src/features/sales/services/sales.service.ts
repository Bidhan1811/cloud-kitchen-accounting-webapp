import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type { Sale, SaleFilters, CreateSalePayload } from "../types/sale.types";

export const salesService = {
  getAll: async (filters: SaleFilters = {}): Promise<PaginatedResponse<Sale>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.append(k, String(v));
    });
    const { data } = await apiClient.get<PaginatedResponse<Sale>>(`/sales?${params}`);
    return data;
  },

  getById: async (id: string): Promise<Sale> => {
    const { data } = await apiClient.get<ApiResponse<Sale>>(`/sales/${id}`);
    return data.data;
  },

  create: async (payload: CreateSalePayload): Promise<Sale> => {
    const { data } = await apiClient.post<ApiResponse<Sale>>("/sales", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateSalePayload>): Promise<Sale> => {
    const { data } = await apiClient.put<ApiResponse<Sale>>(`/sales/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales/${id}`);
  },
};
