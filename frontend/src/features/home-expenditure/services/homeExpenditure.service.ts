import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type {
  HomeExpenditure,
  HomeExpenditureFilters,
  CreateHomeExpenditurePayload,
} from "../types/homeExpenditure.types";

// The axios interceptor in lib/axios.ts automatically unwraps paginated responses:
// backend returns { data: { homeExpenditures: [...], pagination: {...} } }
// interceptor remaps to   { data: [...], pagination: {...} }
// So we type and consume it the same way as expenditure.service.ts.
export const homeExpenditureService = {
  getAll: async (
    filters: HomeExpenditureFilters = {}
  ): Promise<PaginatedResponse<HomeExpenditure>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.append(k, String(v));
    });
    const { data } = await apiClient.get<PaginatedResponse<HomeExpenditure>>(
      `/home-expenses?${params}`
    );
    return data;
  },

  getById: async (id: string): Promise<HomeExpenditure> => {
    const { data } = await apiClient.get<ApiResponse<HomeExpenditure>>(
      `/home-expenses/${id}`
    );
    return data.data;
  },

  create: async (
    payload: CreateHomeExpenditurePayload
  ): Promise<HomeExpenditure> => {
    const { data } = await apiClient.post<ApiResponse<HomeExpenditure>>(
      "/home-expenses",
      payload
    );
    return data.data;
  },

  update: async (
    id: string,
    payload: Partial<CreateHomeExpenditurePayload>
  ): Promise<HomeExpenditure> => {
    const { data } = await apiClient.put<ApiResponse<HomeExpenditure>>(
      `/home-expenses/${id}`,
      payload
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/home-expenses/${id}`);
  },
};
