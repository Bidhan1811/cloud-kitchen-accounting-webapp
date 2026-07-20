import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type { Expenditure, ExpenditureFilters, CreateExpenditurePayload } from "../types/expenditure.types";

export const expenditureService = {
  getAll: async (filters: ExpenditureFilters = {}): Promise<PaginatedResponse<Expenditure>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.append(k, String(v));
    });
    const { data } = await apiClient.get<PaginatedResponse<Expenditure>>(`/expenditures?${params}`);
    return data;
  },

  getById: async (id: string): Promise<Expenditure> => {
    const { data } = await apiClient.get<ApiResponse<Expenditure>>(`/expenditures/${id}`);
    return data.data;
  },

  create: async (payload: CreateExpenditurePayload): Promise<Expenditure> => {
    const { data } = await apiClient.post<ApiResponse<Expenditure>>("/expenditures", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateExpenditurePayload>): Promise<Expenditure> => {
    const { data } = await apiClient.put<ApiResponse<Expenditure>>(`/expenditures/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenditures/${id}`);
  },
};
