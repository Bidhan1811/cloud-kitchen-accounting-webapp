"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { expenditureService } from "../services/expenditure.service";
import type { ExpenditureFilters, CreateExpenditurePayload } from "../types/expenditure.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useExpenditures(filters: ExpenditureFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.EXPENDITURES(filters),
    queryFn: () => expenditureService.getAll(filters),
  });
}

export function useCreateExpenditure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpenditurePayload) => expenditureService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenditures"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Expense recorded!");
    },
    onError: () => toast.error("Failed to record expense."),
  });
}

export function useUpdateExpenditure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateExpenditurePayload> }) =>
      expenditureService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenditures"] });
      toast.success("Expense updated!");
    },
    onError: () => toast.error("Failed to update expense."),
  });
}

export function useDeleteExpenditure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenditureService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenditures"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Expense deleted.");
    },
    onError: () => toast.error("Failed to delete expense."),
  });
}
