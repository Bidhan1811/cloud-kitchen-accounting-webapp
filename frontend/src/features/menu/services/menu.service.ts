import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type { MenuItem, MenuFilters, CreateMenuItemPayload } from "../types/menu.types";

export const menuService = {
  getAll: async (filters: MenuFilters = {}): Promise<PaginatedResponse<MenuItem>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.append(k, String(v));
    });
    const { data } = await apiClient.get<PaginatedResponse<MenuItem>>(`/menu?${params}`);
    return data;
  },

  getById: async (id: string): Promise<MenuItem> => {
    const { data } = await apiClient.get<ApiResponse<MenuItem>>(`/menu/${id}`);
    return data.data;
  },

  create: async (payload: CreateMenuItemPayload): Promise<MenuItem> => {
    const { data } = await apiClient.post<ApiResponse<MenuItem>>("/menu", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateMenuItemPayload>): Promise<MenuItem> => {
    const { data } = await apiClient.put<ApiResponse<MenuItem>>(`/menu/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/menu/${id}`);
  },

  updateStatus: async (id: string, isActive: boolean): Promise<MenuItem> => {
    const { data } = await apiClient.put<ApiResponse<MenuItem>>(`/menu/${id}`, { isActive });
    return data.data;
  },
};
