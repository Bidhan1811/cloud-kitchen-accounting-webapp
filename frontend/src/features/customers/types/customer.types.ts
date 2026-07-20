// Fix in features/customers/types/customer.types.ts:
//
// Your Customer model field is `totalSpend` (no "t"), but CustomersPage
// reads `row.totalSpent` — that typo means every "Total Spend" cell has
// been rendering formatCurrency(undefined) silently. Also add `outstanding`,
// which the backend now computes and returns (not stored on the Customer
// document itself).

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpend: number;      // was likely `totalSpent` before — fix the typo at the type level
  outstanding: number;     // new — computed server-side from unpaid/partial Sale.balanceDue
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  address?: string;
}
