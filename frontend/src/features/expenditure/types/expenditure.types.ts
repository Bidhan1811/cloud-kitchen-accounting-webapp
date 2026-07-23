import type { PaymentMode, ExpenseCategory } from "@/constants/lookups";

export interface Expenditure {
  _id: string;
  expenseId: string;
  date: string;
  category: ExpenseCategory;
  items: string;
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
  createdAt: string;
}

export interface ExpenditureFilters {
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

export interface CreateExpenditurePayload {
  date: string;
  category: ExpenseCategory;
  items: string;
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
}
