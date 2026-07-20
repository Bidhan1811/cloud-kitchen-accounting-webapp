"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, UtensilsCrossed, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import {
  useMenuItems, useCreateMenuItem, useUpdateMenuItem,
  useToggleMenuItemStatus, useDeleteMenuItem
} from "@/features/menu/hooks/useMenuItems";
import { useDebounce } from "@/hooks";
import { formatCurrency } from "@/utils/formatCurrency";
import { MENU_CATEGORIES } from "@/constants/lookups";
import { cn } from "@/utils/cn";
import type { MenuItem } from "@/features/menu/types/menu.types";

const menuSchema = z.object({
  name: z.string().min(2, "Name required"),
  category: z.string().min(1, "Category required"),
  price: z.number().min(1, "Price must be > 0"),
  halfPrice: z.union([z.number().min(1, "Half price must be > 0"), z.literal(0)]).optional(),
  description: z.string().optional(),
});
type MenuFormData = z.infer<typeof menuSchema>;

function MenuItemForm({ onSubmit, isSubmitting, onCancel, defaultValues }: {
  onSubmit: (d: MenuFormData) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
  defaultValues?: Partial<MenuFormData>;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Item Name" placeholder="Paneer Butter Masala" {...register("name")} error={errors.name?.message} />
      <div className="flex flex-col gap-[6px]">
        <label className="text-[13px] font-[500] text-[#6B5D50]">Category</label>
        <select {...register("category")} className="input">
          <option value="">Select category</option>
          {MENU_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        {errors.category && <p className="text-[12px] text-[#C0524A]">{errors.category.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Plate Price (₹)" type="number" placeholder="220" {...register("price", { valueAsNumber: true })} error={errors.price?.message} />
        <div className="flex flex-col gap-[6px]">
          <Input
            label="Half Plate Price (₹) — optional"
            type="number"
            placeholder="leave blank if N/A"
            {...register("halfPrice", {
              setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
            })}
            error={errors.halfPrice?.message}
          />
        </div>
      </div>
      <Input label="Description (Optional)" placeholder="Brief description..." {...register("description")} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth type="button" onClick={onCancel}>Cancel</Button>
        <Button fullWidth type="submit" loading={isSubmitting}>Save Item</Button>
      </div>
    </form>
  );
}

export default function MenuPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useMenuItems({ search: debouncedSearch, category, activeOnly: false, page, limit: 10 });
  const { mutateAsync: createItem, isPending: isCreating } = useCreateMenuItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateMenuItem();
  const { mutateAsync: toggleStatus } = useToggleMenuItemStatus();
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteMenuItem();

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  const getCatLabel = (v: string) => MENU_CATEGORIES.find((c) => c.value === v)?.label ?? v;

  const columns: Column<MenuItem>[] = [
    {
      key: "name",
      header: "Item",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[rgba(200,135,58,0.12)] flex items-center justify-center text-[14px] flex-shrink-0">🍽️</div>
          <p className="text-[13px] font-[500] text-[#1C1410]">{row.name}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (r) => <span className="text-[12px] text-[#6B5D50]">{getCatLabel(r.category)}</span> },
    {
      key: "price",
      header: "Price (₹)",
      className: "amount",
      render: (r) => (
        <div className="flex flex-col items-end gap-0.5">
          <span>{formatCurrency(r.price)}</span>
          {r.halfPrice !== undefined && (
            <span className="text-[10px] text-[#9E8E80] font-[400]">½ {formatCurrency(r.halfPrice)}</span>
          )}
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} /> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          {/* Toggle switch */}
          <button
            type="button"
            onClick={() => toggleStatus({ id: row._id, isActive: !row.isActive })}
            className={cn(
              "relative w-10 h-[22px] rounded-full transition-colors duration-200 flex-shrink-0",
              row.isActive ? "bg-[#4C9A6E]" : "bg-[#C0524A]"
            )}
            aria-label={`Toggle ${row.name} ${row.isActive ? "inactive" : "active"}`}
            role="switch"
            aria-checked={row.isActive}
          >
            <span className={cn(
              "absolute top-[3px] left-0 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
              row.isActive ? "translate-x-[21px]" : "translate-x-[3px]"
            )} />
          </button>
          <button className="btn-icon" onClick={() => { setEditItem(row); setDrawerOpen(true); }} aria-label="Edit">
            <Pencil size={15} />
          </button>
          <button className="btn-icon hover:bg-[rgba(192,82,74,0.12)] hover:text-[#C0524A]" onClick={() => setDeleteId(row._id)} aria-label="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <PageHeader
        title="Menu"
        subtitle="Manage your menu items and pricing"
        action={<Button leftIcon={<Plus size={16} />} onClick={() => { setEditItem(null); setDrawerOpen(true); }}>Add Item</Button>}
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search items..." className="flex-1 min-w-[200px]" />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input h-[44px] w-auto min-w-[150px]">
          <option value="">All Categories</option>
          {MENU_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="glass-card p-1 overflow-hidden">
        <DataTable
          columns={columns} data={items} keyExtractor={(r) => r._id}
          isLoading={isLoading} page={page}
          totalPages={pagination?.totalPages ?? 1} total={pagination?.total ?? 0}
          limit={10} onPageChange={setPage}
          emptyState={
            <EmptyState icon={<UtensilsCrossed size={24} />} title="No menu items"
              description="Add your first dish to start recording sales."
              action={{ label: "+ Add Item", onClick: () => setDrawerOpen(true) }}
            />
          }
        />
      </div>

      <Drawer
        open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); }}
        title={editItem ? "Edit Menu Item" : "Add Menu Item"}
        subtitle="Manage your kitchen offerings"
      >
        <MenuItemForm
          defaultValues={editItem ? { name: editItem.name, category: editItem.category, price: editItem.price, halfPrice: editItem.halfPrice, description: editItem.description } : undefined}
          isSubmitting={editItem ? isUpdating : isCreating}
          onCancel={() => { setDrawerOpen(false); setEditItem(null); }}
          onSubmit={async (data) => {
            if (editItem) await updateItem({ id: editItem._id, payload: data });
            else await createItem(data);
            setDrawerOpen(false); setEditItem(null);
          }}
        />
      </Drawer>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) await deleteItem(deleteId); setDeleteId(null); }}
        title="Remove this item?" description="This will remove the menu item permanently."
        loading={isDeleting}
      />
    </motion.div>
  );
}
