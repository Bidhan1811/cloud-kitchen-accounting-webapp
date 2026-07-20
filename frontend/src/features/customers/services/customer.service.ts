import apiClient from "@/lib/axios";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type { Customer, CustomerFilters, CreateCustomerPayload } from "../types/customer.types";
import type { Sale } from "@/features/sales/types/sale.types";

export const customerService = {
  getAll: async (filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.append(k, String(v));
    });
    const { data } = await apiClient.get<PaginatedResponse<Customer>>(`/customers?${params}`);
    return data;
  },

  getById: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get<ApiResponse<{ profile: Customer }>>(`/customers/${id}`);
    return data.data.profile;
  },

  getOrders: async (id: string): Promise<Sale[]> => {
    const { data } = await apiClient.get<ApiResponse<{ orderHistory: Sale[] }>>(`/customers/${id}`);
    return data.data.orderHistory;
  },

  create: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const { data } = await apiClient.post<ApiResponse<Customer>>("/customers", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateCustomerPayload>): Promise<Customer> => {
    const { data } = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};
