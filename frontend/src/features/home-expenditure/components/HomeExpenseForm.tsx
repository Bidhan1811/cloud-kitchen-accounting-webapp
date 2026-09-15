"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { HOME_EXPENSE_CATEGORIES, PAYMENT_MODES } from "@/constants/lookups";
import { formatDateInput } from "@/utils/formatDate";

const homeExpenseSchema = z.object({
  date: z.string().min(1, "Date required"),
  category: z.string().min(1, "Category required"),
  items: z.string().min(2, "Item description required"),
  amount: z.number().min(1, "Amount must be > 0"),
  paymentMode: z.string().min(1, "Payment mode required"),
  notes: z.string().optional(),
});

export type HomeExpenseFormData = z.infer<typeof homeExpenseSchema>;

interface HomeExpenseFormProps {
  onSubmit: (data: HomeExpenseFormData) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
  defaultValues?: Partial<HomeExpenseFormData>;
}

export function HomeExpenseForm({
  onSubmit,
  isSubmitting,
  onCancel,
  defaultValues,
}: HomeExpenseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HomeExpenseFormData>({
    resolver: zodResolver(homeExpenseSchema),
    defaultValues: {
      date: formatDateInput(new Date()),
      paymentMode: "cash",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date"
          type="date"
          {...register("date")}
          error={errors.date?.message}
        />
        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[500] text-[#6B5D50]">
            Category
          </label>
          <select
            {...register("category")}
            className="input"
            aria-label="Category"
          >
            <option value="">Select category</option>
            {HOME_EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-[12px] text-[#C0524A]">
              {errors.category.message}
            </p>
          )}
        </div>
      </div>

      <Input
        label="Item / Description"
        placeholder="e.g. Grocery shopping, Electricity bill"
        {...register("items")}
        error={errors.items?.message}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount (₹)"
          type="number"
          placeholder="0"
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
        />
        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[500] text-[#6B5D50]">
            Payment Mode
          </label>
          <select {...register("paymentMode")} className="input">
            {PAYMENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Textarea
        label="Notes (Optional)"
        placeholder="Any additional notes..."
        {...register("notes")}
      />

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button fullWidth type="submit" loading={isSubmitting}>
          Save Expense
        </Button>
      </div>
    </form>
  );
}
