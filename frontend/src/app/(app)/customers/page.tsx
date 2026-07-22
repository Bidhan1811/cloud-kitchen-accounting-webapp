"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { useCustomers, useCreateCustomer } from "@/features/customers/hooks/useCustomers";
import { useDebounce } from "@/hooks";
import { formatCurrency } from "@/utils/formatCurrency";
import { generateInitials, stringToColor } from "@/utils/strings";
import { cn } from "@/utils/cn";
import type { Customer } from "@/features/customers/types/customer.types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";

const customerSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Valid phone required"),
  address: z.string().optional(),
});
type CustomerFormData = z.infer<typeof customerSchema>;

function CustomerForm({ onSubmit, isSubmitting, onCancel }: { onSubmit: (d: CustomerFormData) => void; isSubmitting?: boolean; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({ resolver: zodResolver(customerSchema) });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Customer Name" placeholder="Rohit Singh" {...register("name")} error={errors.name?.message} />
      <Input label="Phone Number" placeholder="9876543210" {...register("phone")} error={errors.phone?.message} />
      <Input label="Address (Optional)" placeholder="Sector 15, Noida, UP" {...register("address")} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth type="button" onClick={onCancel}>Cancel</Button>
        <Button fullWidth type="submit" loading={isSubmitting}>Add Customer</Button>
      </div>
    </form>
  );
}

import { useIsMobile } from "@/hooks";
import { MobileListCard } from "@/components/mobile/MobileListCard";
import { MobileBottomDrawer } from "@/components/mobile/MobileBottomDrawer";
import { MobileSearchFilterBar } from "@/components/mobile/MobileSearchFilterBar";
import { Phone, MapPin } from "lucide-react";

export default function CustomersPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useCustomers({ search: debouncedSearch, page, limit: 10 });
  const { mutateAsync: createCustomer, isPending } = useCreateCustomer();
  const isMobile = useIsMobile();

  const customers = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-[700] text-[#C8873A] flex-shrink-0"
            style={{ background: stringToColor(row.name) }}>
            {generateInitials(row.name)}
          </div>
          <div>
            <p className="text-[13px] font-[500] text-[#1C1410]">{row.name}</p>
            <p className="text-[11px] text-[#9E8E80]">{row.phone}</p>
          </div>
        </div>
      ),
    },
    { key: "totalOrders", header: "Orders", render: (r) => <span className="font-mono font-[600]">{r.totalOrders}</span> },
    { key: "totalSpend", header: "Total Spend", className: "amount", render: (r) => formatCurrency(r.totalSpend) },
    {
      key: "outstanding",
      header: "Outstanding",
      render: (r) => (
        <span className={cn("font-mono font-[600] text-[13px]", r.outstanding > 0 ? "text-[#C0524A]" : "text-[#9E8E80]")}>
          {r.outstanding > 0 ? formatCurrency(r.outstanding) : "₹0"}
        </span>
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
        title="Customers"
        subtitle="Manage your regular customers"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
            Add Customer
          </Button>
        }
      />

      <div className="hidden md:block mb-5">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customers..." className="max-w-sm" />
      </div>

      <div className="md:hidden mb-4">
        <MobileSearchFilterBar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
        />
      </div>

      <div className="hidden md:block glass-card p-1 overflow-hidden">
        <DataTable
          columns={columns}
          data={customers}
          keyExtractor={(r) => r._id}
          isLoading={isLoading}
          onRowClick={(r) => router.push(`/customers/${r._id}`)}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          total={pagination?.total ?? 0}
          limit={10}
          onPageChange={setPage}
          emptyState={
            <EmptyState icon={<Users size={24} />} title="No customers yet"
              description="Add your first regular customer."
              action={{ label: "+ Add Customer", onClick: () => setDrawerOpen(true) }}
            />
          }
        />
      </div>

      <div className="md:hidden flex flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-4 flex gap-3 h-[72px]">
              <div className="skeleton h-full w-full rounded-md" />
            </div>
          ))
        ) : customers.length === 0 ? (
          <EmptyState icon={<Users size={24} />} title="No customers yet"
            description="Add your first regular customer."
            action={{ label: "+ Add Customer", onClick: () => setDrawerOpen(true) }}
          />
        ) : (
          customers.map(c => (
            <MobileListCard
              key={c._id}
              onClick={() => router.push(`/customers/${c._id}`)}
              avatar={
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-[700] text-[#C8873A] flex-shrink-0"
                  style={{ background: stringToColor(c.name) }}>
                  {generateInitials(c.name)}
                </div>
              }
              title={c.name}
              subtitle={
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                    <Phone size={10} /> {c.phone}
                  </div>
                  {c.address && (
                    <div className="flex items-center gap-1 text-[11px] text-text-secondary max-w-[120px] truncate">
                      <MapPin size={10} /> <span className="truncate">{c.address}</span>
                    </div>
                  )}
                </div>
              }
              trailing={
                <div className="flex flex-col items-end gap-1">
                  <span className="font-jetbrains font-bold text-[14px] text-text-primary">
                    {formatCurrency(c.totalSpend)}
                  </span>
                  {c.outstanding > 0 && (
                    <span className="text-[10px] text-error">
                      Due: {formatCurrency(c.outstanding)}
                    </span>
                  )}
                </div>
              }
            />
          ))
        )}
      </div>

      <FormDrawerComponent open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Customer" subtitle="Create a new customer profile">
        <CustomerForm
          isSubmitting={isPending}
          onCancel={() => setDrawerOpen(false)}
          onSubmit={async (data) => { await createCustomer(data); setDrawerOpen(false); }}
        />
      </FormDrawerComponent>
    </motion.div>
  );
}