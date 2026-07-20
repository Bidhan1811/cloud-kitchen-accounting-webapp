import type { PaymentMode } from "@/constants/lookups";

export interface SaleItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  portion?: "full" | "half";
  isCustom?: boolean;
  menuItem?: string;
}

export type SchemaPaymentMode = "Cash" | "UPI" | "Card" | "Credit";
export type PaymentStatus = "Paid" | "Unpaid" | "Partial";

export interface PopulatedCustomerRef {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpend: number;
}

export interface Sale {
  _id: string;
  invoiceId: string;
  date: string;
  // Populated by the backend on reads (getSales/getSaleById use .populate)
  customer: PopulatedCustomerRef;
  // Denormalized snapshot fields, always present regardless of populate
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: SaleItem[];
  itemsTotal: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMode?: SchemaPaymentMode;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  createdAt: string;
}

export interface SaleFilters {
  search?: string;
  status?: string;
  paymentMode?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface CreateSalePayload {
  date: string;
  // The backend resolves/creates the Customer from these fields and sets the
  // customer ObjectId ref itself — the frontend never sends a customer id
  // directly on create.
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: { itemName: string; quantity: number; unitPrice: number; portion?: "full" | "half"; isCustom?: boolean; menuItem?: string }[];
  deliveryCharge?: number;
  paymentMode?: SchemaPaymentMode;
  paymentStatus: PaymentStatus;
  amountPaid?: number;
  notes?: string;
}