import type { LedgerBalance } from "@/features/ledger/types/ledger.types";

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpend: number;
  outstanding: number; // existing sale-level outstanding — from unpaid/partial Sale.balanceDue
  isCreditCustomer: boolean;
  // Only present when isCreditCustomer is true. Computed separately from
  // `outstanding` above — the two are deliberately independent numbers,
  // never merged. See backend customer.service.js for why.
  creditBalance?: LedgerBalance;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
  isCreditCustomer?: boolean;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  address?: string;
  isCreditCustomer?: boolean;
  // Only applied by the backend on the false -> true transition of
  // isCreditCustomer; ignored otherwise.
  openingBalance?: number;
}