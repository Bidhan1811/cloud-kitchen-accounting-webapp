"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stepper } from "@/components/ui/Stepper";
import { PAYMENT_MODES } from "@/constants/lookups";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateInput } from "@/utils/formatDate";
import { ItemPicker } from "./ItemPicker";
import { useCustomerSearch } from "@/features/customers/hooks/useCustomers";
import { generateInitials, stringToColor } from "@/utils/strings";
import { useDebounce } from "@/hooks";
import type { MenuItem } from "@/features/menu/types/menu.types";
import type { Customer } from "@/features/customers/types/customer.types";
import { cn } from "@/utils/cn";

// PAYMENT_MODES values are lowercase ("cash", "upi", "card", "credit") for
// use elsewhere in the app, but the Sale schema's paymentMode enum requires
// the capitalized form ("Cash", "UPI", "Card", "Credit"). Map on submit
// rather than changing the shared constant.
const PAYMENT_MODE_TO_SCHEMA_VALUE: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  credit: "Credit",
};

const saleSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    customerId: z.string().optional(), // set only when an existing customer was picked
    customerName: z.string().min(1, "Customer name is required"),
    customerPhone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number"),
    customerAddress: z.string().optional(),
    items: z
      .array(
        z.object({
          itemName: z.string().min(1, "Item name required"),
          quantity: z.number().min(1, "Qty must be ≥ 1"),
          unitPrice: z.number().min(0, "Price must be ≥ 0"),
          // halfPrice is stored in form state for live toggle — not sent to backend
          halfPrice: z.number().optional(),
          portion: z.enum(["full", "half"]).optional(),
          isCustom: z.boolean().optional(),
          menuItem: z.string().optional(),
        })
      )
      .min(1, "Add at least one item"),
    deliveryCharge: z.number().min(0).optional(),
    paymentMode: z.string().optional(),
    paymentStatus: z.enum(["Paid", "Unpaid", "Partial"]),
    amountPaid: z.number().min(0).optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.paymentStatus === "Paid" || data.paymentStatus === "Partial") && !data.paymentMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMode"],
        message: "Select a payment mode",
      });
    }
    if (data.paymentStatus === "Partial") {
      if (!data.amountPaid || data.amountPaid <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amountPaid"],
          message: "Enter the amount received",
        });
      }
    }
  });

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormProps {
  onSubmit: (data: SaleFormData) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
  defaultValues?: Partial<SaleFormData>;
}

export function SaleForm({ onSubmit, isSubmitting, onCancel, defaultValues }: SaleFormProps) {
  const [showItemPicker, setShowItemPicker] = useState(false);

  // Customer autocomplete state
  const [nameQuery, setNameQuery] = useState(defaultValues?.customerName ?? "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const debouncedNameQuery = useDebounce(nameQuery, 250);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: matches, isFetching: isSearching } = useCustomerSearch(debouncedNameQuery);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      date: formatDateInput(new Date()),
      paymentMode: "cash",
      paymentStatus: "Paid",
      deliveryCharge: 0,
      amountPaid: 0,
      items: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const deliveryCharge = watch("deliveryCharge") ?? 0;
  const paymentStatus = watch("paymentStatus");
  const amountPaid = watch("amountPaid") ?? 0;

  const subtotal = watchedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity || 0), 0);
  const grandTotal = subtotal + deliveryCharge;
  const balanceDue = Math.max(grandTotal - amountPaid, 0);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNameChange = (value: string) => {
    setNameQuery(value);
    setValue("customerName", value);
    setShowDropdown(value.trim().length >= 2);

    // Typing again after a selection means they might want someone else —
    // clear the lock so phone/address become editable again until they
    // either re-pick from the dropdown or the name no longer matches anyone.
    if (selectedCustomer && value !== selectedCustomer.name) {
      setSelectedCustomer(null);
      setValue("customerId", undefined);
      setValue("customerPhone", "");
      setValue("customerAddress", "");
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNameQuery(customer.name);
    setValue("customerId", customer._id);
    setValue("customerName", customer.name);
    setValue("customerPhone", customer.phone);
    setValue("customerAddress", customer.address ?? "");
    setShowDropdown(false);
  };

  const handleClearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setValue("customerId", undefined);
    setValue("customerPhone", "");
    setValue("customerAddress", "");
  };

  const handleAddItem = (item: MenuItem) => {
    append({
      itemName: item.name,
      quantity: 1,
      unitPrice: item.price,
      halfPrice: item.halfPrice,
      portion: "full",
      menuItem: item._id,
      isCustom: false,
    });
    setShowItemPicker(false);
  };

  const handleAddCustomItem = () => {
    append({ itemName: "", quantity: 1, unitPrice: 0, isCustom: true });
    setShowItemPicker(false);
  };


  // Retrieve the full price for an item by looking at the current unitPrice when
  // portion is "full", or at a separately stored reference.
  // We store fullPrice as a parallel field not sent to backend; simple approach:
  // derive it from the fact that when portion flips to "half" we store halfPrice
  // and when flipping back to "full" we need the original full price.
  // We use a ref map keyed by field index to remember the original full price.
  const fullPriceRef = useRef<Record<number, number>>({});

  const getFullPrice = (index: number) => fullPriceRef.current[index] ?? watchedItems[index]?.unitPrice ?? 0;

  // When a menu item is appended we record its full price so toggling back works.
  useEffect(() => {
    watchedItems.forEach((item, i) => {
      if (!item.isCustom && item.portion === "full" && item.halfPrice !== undefined) {
        // unitPrice is the full price when portion is "full"
        fullPriceRef.current[i] = item.unitPrice;
      }
    });
  }, [watchedItems.length]); // only re-run when items are added/removed

  const handlePortionChange = (index: number, portion: "full" | "half") => {
    const item = watchedItems[index];
    if (portion === "half" && item.halfPrice !== undefined) {
      // Remember current full price before switching
      fullPriceRef.current[index] = item.unitPrice;
      setValue(`items.${index}.portion`, portion);
      setValue(`items.${index}.unitPrice`, item.halfPrice);
    } else if (portion === "full") {
      const storedFull = fullPriceRef.current[index];
      setValue(`items.${index}.portion`, portion);
      if (storedFull !== undefined) {
        setValue(`items.${index}.unitPrice`, storedFull);
      }
    }
  };

  const handleFormSubmit = (data: SaleFormData) => {
    onSubmit({
      ...data,
      paymentMode: data.paymentMode
        ? PAYMENT_MODE_TO_SCHEMA_VALUE[data.paymentMode] ?? data.paymentMode
        : data.paymentMode,
      amountPaid: data.paymentStatus === "Partial" ? data.amountPaid : undefined,
    });
  };

  // Show manual phone/address fields only once the user has typed a name,
  // hasn't picked an existing customer, AND the dropdown itself is closed —
  // otherwise the two would render on top of each other while searching.
  const showNewCustomerFields = !selectedCustomer && !showDropdown && nameQuery.trim().length > 0;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {/* Date */}
      <Input label="Date" type="date" {...register("date")} error={errors.date?.message} />

      {/* Customer name with autocomplete */}
      <div className="relative" ref={dropdownRef}>
        <label className="text-[13px] font-[500] text-[#6B5D50] mb-[6px] block">Customer Name</label>

        {selectedCustomer ? (
          // Locked state — existing customer selected
          <div className="glass-card px-3 py-2.5 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-[700] text-[#C8873A] flex-shrink-0"
              style={{ background: stringToColor(selectedCustomer.name) }}
            >
              {generateInitials(selectedCustomer.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[600] text-[#1C1410] truncate">{selectedCustomer.name}</p>
              <p className="text-[11px] text-[#9E8E80]">{selectedCustomer.phone}</p>
            </div>
            <button
              type="button"
              onClick={handleClearSelectedCustomer}
              className="btn-icon flex-shrink-0"
              aria-label="Change customer"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <Input
            placeholder="Start typing a customer name..."
            value={nameQuery}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => nameQuery.trim().length >= 2 && setShowDropdown(true)}
            error={errors.customerName?.message}
          />
        )}

        {/* Dropdown — solid background (not glass-card) so it fully occludes
            the new-customer fields or anything else behind it */}
        {showDropdown && !selectedCustomer && (
          <div className="absolute z-20 mt-1 w-full bg-[#FFFBF4] border border-[rgba(200,135,58,0.20)] rounded-[16px] p-1.5 max-h-[240px] overflow-y-auto shadow-[0_12px_32px_rgba(60,40,20,0.18)]">
            {isSearching ? (
              <p className="text-[12px] text-[#9E8E80] px-3 py-2">Searching...</p>
            ) : matches && matches.length > 0 ? (
              matches.map((customer) => (
                <button
                  key={customer._id}
                  type="button"
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-[10px] hover:bg-[rgba(200,135,58,0.10)] transition-colors text-left"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-[700] text-[#C8873A] flex-shrink-0"
                    style={{ background: stringToColor(customer.name) }}
                  >
                    {generateInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-[500] text-[#1C1410] truncate">{customer.name}</p>
                    <p className="text-[11px] text-[#9E8E80]">{customer.phone}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-[12px] text-[#9E8E80] px-3 py-2">
                No match — this will be added as a new customer.
              </p>
            )}
          </div>
        )}
      </div>

      {/* New customer details — only when a name is typed and nobody's been picked */}
      {showNewCustomerFields && (
        <div className="grid grid-cols-2 gap-3 glass-card p-4">
          <div className="col-span-2">
            <p className="text-[11px] uppercase tracking-wide font-[600] text-[#9E8E80] mb-1">
              New customer — enter their details
            </p>
          </div>
          <Input
            label="Phone Number"
            placeholder="10-digit mobile number"
            {...register("customerPhone")}
            error={errors.customerPhone?.message}
          />
          <Input
            label="Address (Optional)"
            placeholder="Delivery address"
            {...register("customerAddress")}
          />
        </div>
      )}

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-[600] text-[#1C1410]">Items</p>
          {errors.items?.root && (
            <p className="text-[11px] text-[#C0524A]">{errors.items.root.message}</p>
          )}
        </div>

        {fields.length > 0 && (
          <div className="grid grid-cols-[1fr_80px_80px_80px_32px] gap-2 mb-2">
            <p className="text-[10px] uppercase tracking-wide text-[#9E8E80] font-[500]">Item</p>
            <p className="text-[10px] uppercase tracking-wide text-[#9E8E80] font-[500] text-center">Qty</p>
            <p className="text-[10px] uppercase tracking-wide text-[#9E8E80] font-[500] text-right">Price</p>
            <p className="text-[10px] uppercase tracking-wide text-[#9E8E80] font-[500] text-right">Total</p>
            <div />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {fields.map((field, index) => {
            const item = watchedItems[index];
            const qty = item?.quantity ?? 1;
            const price = item?.unitPrice ?? 0;
            const rowTotal = qty * price;
            const hasHalf = !item?.isCustom && item?.halfPrice !== undefined;
            const currentPortion = item?.portion ?? "full";
            return (
              <div key={field.id} className="flex flex-col gap-1.5">
                <div className="grid grid-cols-[1fr_80px_80px_80px_32px] gap-2 items-center">
                  <Input
                    placeholder="Item name"
                    {...register(`items.${index}.itemName`)}
                    error={errors.items?.[index]?.itemName?.message}
                    className="text-[13px]"
                  />
                  <Controller
                    control={control}
                    name={`items.${index}.quantity`}
                    render={({ field: f }) => (
                      <Stepper value={f.value} onChange={f.onChange} min={1} />
                    )}
                  />
                  <Input
                    type="number"
                    placeholder="₹0"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    className="text-[13px] text-right"
                  />
                  <Input
                    type="number"
                    value={rowTotal || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && qty > 0) {
                        setValue(`items.${index}.unitPrice`, parseFloat((val / qty).toFixed(2)));
                      }
                    }}
                    className="font-mono text-[13px] font-[600] text-right text-[#1C1410]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      delete fullPriceRef.current[index];
                      remove(index);
                    }}
                    className="btn-icon text-[#C0524A] hover:bg-[rgba(192,82,74,0.12)] hover:border-[rgba(192,82,74,0.20)]"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {/* Portion toggle — only for menu items that have halfPrice */}
                {hasHalf && (
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-[10px] text-[#9E8E80] uppercase tracking-wide font-[500]">Portion:</span>
                    <div className="flex items-center glass-input p-[2px] rounded-full gap-[2px]">
                      {(["full", "half"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePortionChange(index, p)}
                          className={cn(
                            "px-3 py-[4px] rounded-full text-[10px] font-[600] transition-all capitalize",
                            currentPortion === p
                              ? "bg-[#C8873A] text-white shadow-sm"
                              : "text-[#9E8E80] hover:text-[#6B5D50]"
                          )}
                          aria-label={`Set ${p} plate`}
                        >
                          {p === "full" ? "Full" : "Half"}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-[#9E8E80]">
                      {currentPortion === "half"
                        ? `₹${item.halfPrice}`
                        : `₹${getFullPrice(index)}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showItemPicker && (
          <div className="mt-2 glass-card overflow-hidden">
            <ItemPicker onSelect={handleAddItem} onCustom={handleAddCustomItem} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowItemPicker((p) => !p)}
          className="mt-3 flex items-center gap-2 text-[13px] font-[500] text-[#C8873A] hover:text-[#A06828] transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      <div className="h-px bg-[rgba(255,255,255,0.40)]" />

      {/* Totals */}
      <div className="glass-card p-4 flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span className="text-[#6B5D50]">Items Total</span>
          <span className="font-mono font-[600]">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-[#6B5D50]">Delivery Charge</span>
          <div className="w-24">
            <Input type="number" placeholder="0" {...register("deliveryCharge", { valueAsNumber: true })} className="text-right text-[13px]" />
          </div>
        </div>
        <div className="h-px bg-[rgba(255,255,255,0.40)] my-1" />
        <div className="flex justify-between text-[15px] font-[700]">
          <span className="text-[#1C1410]">Grand Total</span>
          <span className="font-mono text-[#4C9A6E] text-[18px]">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-[6px]">
          <label className="text-[13px] font-[500] text-[#6B5D50]">Payment Status</label>
          <div className="glass-input flex p-[3px] rounded-full gap-[2px]">
            {(["Paid", "Unpaid", "Partial"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue("paymentStatus", s)}
                className={cn(
                  "flex-1 py-[7px] rounded-full text-[11px] font-[500] transition-all",
                  paymentStatus === s
                    ? s === "Paid"
                      ? "bg-[#4C9A6E] text-white"
                      : s === "Unpaid"
                      ? "bg-[#C0524A] text-white"
                      : "bg-[#B8862E] text-white"
                    : "text-[#9E8E80]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {(paymentStatus === "Paid" || paymentStatus === "Partial") && (
          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-[500] text-[#6B5D50]">Payment Mode</label>
            <select {...register("paymentMode")} className="input">
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {errors.paymentMode && (
              <p className="text-[11px] text-[#C0524A]">{errors.paymentMode.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Partial payment amount */}
      {paymentStatus === "Partial" && (
        <div className="glass-card p-4 flex flex-col gap-3">
          <Input
            label="Amount Received"
            type="number"
            placeholder="₹0"
            {...register("amountPaid", { valueAsNumber: true })}
            error={errors.amountPaid?.message}
          />
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B5D50]">Balance Due</span>
            <span className="font-mono font-[600] text-[#C0524A]">{formatCurrency(balanceDue)}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <Input label="Notes (Optional)" placeholder="Any special instructions..." {...register("notes")} />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" fullWidth onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button fullWidth type="submit" loading={isSubmitting}>
          Save Sale
        </Button>
      </div>
    </form>
  );
}