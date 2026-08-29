"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customerService } from "../services/customer.service";
import type { Customer, CustomerFilters, CreateCustomerPayload } from "../types/customer.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMERS(filters),
    queryFn: () => customerService.getAll(filters),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER(id),
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
}

export function useCustomerOrders(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER_ORDERS(id),
    queryFn: () => customerService.getOrders(id),
    enabled: !!id,
  });
}

/**
 * Backs the customer-name autocomplete in SaleForm. Reuses the existing
 * getCustomers endpoint (search + limit) rather than a dedicated search
 * route — no new backend endpoint needed.
 */
export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: ["customers", "search", query],
    queryFn: () => customerService.getAll({ search: query, limit: 8 }),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    select: (result) => result.data,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => customerService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added!");
    },
    onError: () => toast.error("Failed to add customer."),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateCustomerPayload> }) =>
      customerService.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMER(id) });
      toast.success("Customer updated!");
    },
    onError: () => toast.error("Failed to update customer."),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer removed.");
    },
    onError: () => toast.error("Failed to remove customer."),
  });
}