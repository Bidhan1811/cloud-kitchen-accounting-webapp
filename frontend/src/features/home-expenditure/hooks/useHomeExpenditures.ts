"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { homeExpenditureService } from "../services/homeExpenditure.service";
import type {
  HomeExpenditureFilters,
  CreateHomeExpenditurePayload,
} from "../types/homeExpenditure.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useHomeExpenditures(filters: HomeExpenditureFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.HOME_EXPENDITURES(filters),
    queryFn: () => homeExpenditureService.getAll(filters),
  });
}

export function useCreateHomeExpenditure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHomeExpenditurePayload) =>
      homeExpenditureService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-expenditures"] });
      toast.success("Home expense recorded!");
    },
    onError: () => toast.error("Failed to record home expense."),
  });
}

export function useUpdateHomeExpenditure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateHomeExpenditurePayload>;
    }) => homeExpenditureService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-expenditures"] });
      toast.success("Home expense updated!");
    },
    onError: () => toast.error("Failed to update home expense."),
  });
}

export function useDeleteHomeExpenditure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeExpenditureService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-expenditures"] });
      toast.success("Home expense deleted.");
    },
    onError: () => toast.error("Failed to delete home expense."),
  });
}
