import type { HomeExpenseCategory } from "@/constants/lookups";
import type { PaymentMode } from "@/constants/lookups";

export interface HomeExpenditure {
  _id: string;
  homeExpenseId: string;
  date: string;
  category: HomeExpenseCategory;
  items: string;
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
  createdAt: string;
}

export interface HomeExpenditureFilters {
  search?: string;
  category?: string;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface CreateHomeExpenditurePayload {
  date: string;
  category: HomeExpenseCategory;
  items: string;
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
}
