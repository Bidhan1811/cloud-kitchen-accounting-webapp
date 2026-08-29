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
import { useDebounce, useIsMobile } from "@/hooks";
import { formatCurrency } from "@/utils/formatCurrency";
import { MENU_CATEGORIES } from "@/constants/lookups";
import { cn } from "@/utils/cn";
import { MobileListCard } from "@/components/mobile/MobileListCard";
import { MobileSectionAccordion } from "@/components/mobile/MobileSectionAccordion";
import { MobileSearchFilterBar } from "@/components/mobile/MobileSearchFilterBar";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import type { MenuItem } from "@/features/menu/types/menu.types";
import { VoiceMicButton } from "@/features/voice/components/VoiceMicButton";
import type { VoiceParseResult } from "@/features/voice/services/voice.service";

const menuSchema = z.object({
  name: z.string().min(2, "Name required"),
  category: z.string().min(1, "Category required"),
  price: z.number().min(1, "Price must be > 0"),
  halfPrice: z.union([z.number().min(1, "Half price must be > 0"), z.literal(0)]).optional(),
  description: z.string().optional(),
});
type MenuFormData = z.infer<typeof menuSchema>;

interface VoiceMenuExtract {
  name?: string | null;
  category?: string | null;
  price?: number | null;
  halfPrice?: number | null;
  description?: string | null;
}

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
  const [viewItem, setViewItem] = useState<MenuItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  // Voice draft — maps 1:1 onto MenuItemForm's fields already.
  const [voiceDraft, setVoiceDraft] = useState<{ defaultValues: VoiceMenuExtract; transcript: string } | null>(null);

  const { data, isLoading } = useMenuItems({ search: debouncedSearch, category, activeOnly: false, page, limit: 10 });
  const { mutateAsync: createItem, isPending: isCreating } = useCreateMenuItem();
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateMenuItem();
  const { mutateAsync: toggleStatus } = useToggleMenuItemStatus();
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteMenuItem();

  const isMobile = useIsMobile();

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  const getCatLabel = (v: string) => MENU_CATEGORIES.find((c) => c.value === v)?.label ?? v;

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    for (const item of items) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [items]);

  const handleVoiceResult = (result: VoiceParseResult<VoiceMenuExtract>) => {
    setEditItem(null);
    setVoiceDraft({ defaultValues: result.extracted, transcript: result.transcript });
    setDrawerOpen(true);
  };

  const columns: Column<MenuItem>[] = [
    {
      key: "name",
      header: "Item",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[rgba(155,114,88,0.12)] flex items-center justify-center text-[14px] flex-shrink-0">🍽️</div>
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
          <button className="btn-icon" onClick={() => { setEditItem(row); setVoiceDraft(null); setDrawerOpen(true); }} aria-label="Edit">
            <Pencil size={15} />
          </button>
          <button className="btn-icon hover:bg-[rgba(192,82,74,0.12)] hover:text-[#C0524A]" onClick={() => setDeleteId(row._id)} aria-label="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const FormDrawerComponent = isMobile ? MobileBottomDrawer : Drawer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      <PageHeader
        title="Menu"
        subtitle="Manage your menu items and pricing"
        action={
          <div className="flex items-center gap-2">
            <VoiceMicButton<VoiceMenuExtract> context="menu" onResult={handleVoiceResult} />
            <Button leftIcon={<Plus size={16} />} onClick={() => { setEditItem(null); setVoiceDraft(null); setDrawerOpen(true); }}>
              Add Item
            </Button>
          </div>
        }
      />

      <div className="hidden md:flex flex-wrap items-center gap-2 mb-5">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search items..." className="flex-1 min-w-[200px]" />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input h-[44px] w-auto min-w-[150px]">
          <option value="">All Categories</option>
          {MENU_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="md:hidden mb-4 flex flex-col gap-3">
        <MobileSearchFilterBar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
        />
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-4 px-4">
          <button
            className={cn("whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium border transition-all", category === "" ? "bg-primary-gradient border-transparent" : "bg-glass-input text-text-secondary border-glass-border")}
            onClick={() => { setCategory(""); setPage(1); }}
          >
            All Categories
          </button>
          {MENU_CATEGORIES.map(c => (
            <button
              key={c.value}
              className={cn("whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium border transition-all", category === c.value ? "bg-primary-gradient border-transparent" : "bg-glass-input text-text-secondary border-glass-border")}
              onClick={() => { setCategory(c.value); setPage(1); }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-1 overflow-hidden hidden md:block">
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

      <div className="md:hidden flex flex-col pb-[env(safe-area-inset-bottom)]">
        {isLoading ? (
          <div className="glass-card p-4 h-[72px] flex mb-3"><div className="skeleton h-full w-full rounded-md" /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={<UtensilsCrossed size={24} />} title="No menu items"
            description="No items found."
            action={{ label: "+ Add Item", onClick: () => setDrawerOpen(true) }}
          />
        ) : (
          <>
            {Object.entries(groupedItems).map(([catValue, catItems]) => (
              <MobileSectionAccordion key={catValue} title={getCatLabel(catValue)} count={catItems.length}>
                {catItems.map((item) => (
                  <MobileListCard
                    key={item._id}
                    onClick={() => setViewItem(item)}
                    avatar={<div className="w-10 h-10 rounded-full bg-[#9B7258]/10 flex items-center justify-center text-[16px]">🍽️</div>}
                    title={item.name}
                    subtitle={item.description ?? "No description"}
                    trailing={
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-jetbrains font-bold text-[14px]">{formatCurrency(item.price)}</span>
                        {category === "" && (
                          <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-full text-text-secondary">{getCatLabel(item.category)}</span>
                        )}
                      </div>
                    }
                  />
                ))}
              </MobileSectionAccordion>
            ))}

            {(pagination?.totalPages ?? 1) > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    "px-4 py-2 rounded-full text-[13px] font-medium border transition-colors",
                    page <= 1
                      ? "text-text-tertiary border-glass-border opacity-50"
                      : "text-[#9B7258] border-[#9B7258]/40 bg-glass-input"
                  )}
                >
                  Previous
                </button>
                <span className="text-[12px] text-text-secondary">
                  Page {page} of {pagination?.totalPages ?? 1}
                </span>
                <button
                  type="button"
                  disabled={page >= (pagination?.totalPages ?? 1)}
                  onClick={() => setPage((p) => Math.min(pagination?.totalPages ?? 1, p + 1))}
                  className={cn(
                    "px-4 py-2 rounded-full text-[13px] font-medium border transition-colors",
                    page >= (pagination?.totalPages ?? 1)
                      ? "text-text-tertiary border-glass-border opacity-50"
                      : "text-[#9B7258] border-[#9B7258]/40 bg-glass-input"
                  )}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <FormDrawerComponent
        open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditItem(null); setVoiceDraft(null); }}
        title={editItem ? "Edit Menu Item" : "Add Menu Item"}
        subtitle="Manage your kitchen offerings"
      >
        {voiceDraft?.transcript && (
          <div className="glass-card p-3 text-[12px] text-[#6B5D50] flex flex-col gap-1 mb-4">
            <span className="uppercase tracking-wide text-[10px] font-[600] text-[#9E8E80]">You said</span>
            <span className="italic">"{voiceDraft.transcript}"</span>
            <span className="text-[11px] text-[#9E8E80] mt-1">
              Review the fields below before saving — voice entry isn't always perfect.
            </span>
          </div>
        )}
        <MenuItemForm
          key={editItem?._id ?? (voiceDraft ? "voice" : "new")}
          defaultValues={
            editItem
              ? { name: editItem.name, category: editItem.category, price: editItem.price, halfPrice: editItem.halfPrice, description: editItem.description }
              : voiceDraft
              ? {
                  name: voiceDraft.defaultValues.name ?? "",
                  category: voiceDraft.defaultValues.category ?? "",
                  price: voiceDraft.defaultValues.price ?? undefined,
                  halfPrice: voiceDraft.defaultValues.halfPrice ?? undefined,
                  description: voiceDraft.defaultValues.description ?? "",
                }
              : undefined
          }
          isSubmitting={editItem ? isUpdating : isCreating}
          onCancel={() => { setDrawerOpen(false); setEditItem(null); setVoiceDraft(null); }}
          onSubmit={async (data) => {
            if (editItem) await updateItem({ id: editItem._id, payload: data });
            else await createItem(data);
            setDrawerOpen(false); setEditItem(null); setVoiceDraft(null);
          }}
        />
      </FormDrawerComponent>

      <MobileBottomDrawer
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.name}
        subtitle={getCatLabel(viewItem?.category ?? "")}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setDeleteId(viewItem?._id ?? null); setViewItem(null); }}>
              Delete
            </Button>
            <Button className="flex-1" onClick={() => { setEditItem(viewItem); setDrawerOpen(true); setViewItem(null); }}>
              Edit
            </Button>
          </div>
        }
      >
        {viewItem && (
          <div className="glass-card p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[#6B5D50] text-[13px]">Full Price</span>
              <span className="font-jetbrains font-bold text-[15px]">{formatCurrency(viewItem.price)}</span>
            </div>
            {viewItem.halfPrice !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-[#6B5D50] text-[13px]">Half Price</span>
                <span className="font-jetbrains font-bold text-[15px]">{formatCurrency(viewItem.halfPrice)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#6B5D50] text-[13px]">Status</span>
              <StatusBadge status={viewItem.isActive ? "active" : "inactive"} />
            </div>
            {viewItem.description && (
              <div className="mt-2">
                <p className="text-[12px] uppercase tracking-wide text-[#9E8E80] font-[600] mb-1">Description</p>
                <p className="text-[14px] text-[#1C1410]">{viewItem.description}</p>
              </div>
            )}
          </div>
        )}
      </MobileBottomDrawer>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) await deleteItem(deleteId); setDeleteId(null); }}
        title="Remove this item?" description="This will remove the menu item permanently."
        loading={isDeleting}
      />
    </motion.div>
  );
}