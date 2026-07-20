"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { menuService } from "../services/menu.service";
import type { MenuFilters, CreateMenuItemPayload } from "../types/menu.types";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useMenuItems(filters: MenuFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.MENU_ITEMS(filters),
    queryFn: () => menuService.getAll(filters),
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMenuItemPayload) => menuService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Menu item added!");
    },
    onError: () => toast.error("Failed to add item."),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateMenuItemPayload> }) =>
      menuService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Menu item updated!");
    },
    onError: () => toast.error("Failed to update item."),
  });
}

export function useToggleMenuItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      menuService.updateStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
    onError: () => toast.error("Failed to update status."),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Item removed.");
    },
    onError: () => toast.error("Failed to remove item."),
  });
}
