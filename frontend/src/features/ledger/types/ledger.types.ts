export type LedgerTransactionType =
  | "OPENING_BALANCE"
  | "SALE"
  | "PAYMENT"
  | "ADJUSTMENT"
  | "REVERSAL";

export type LedgerAdjustmentType = "DEBIT" | "CREDIT";

export type LedgerPaymentMode = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Other";

export interface SaleItemSnapshot {
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  portion?: "full" | "half";
  isCustom?: boolean;
}

export interface LedgerTransaction {
  _id: string;
  type: LedgerTransactionType;
  adjustmentType?: LedgerAdjustmentType;
  amount: number;
  balanceImpact: number;
  saleId?: string | null;
  /** Populated by the backend on SALE-type transactions — the order's line items. */
  saleItems?: SaleItemSnapshot[];
  paymentMode?: LedgerPaymentMode;
  reference?: string;
  description?: string;
  transactionDate: string;
  createdAt: string;
  // Derived by the backend for direct table display — no frontend math needed.
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface LedgerBalance {
  amount: number;
  label: "Outstanding" | "Advance Balance" | "Settled";
  isAdvance: boolean;
  isSettled: boolean;
}

export interface CustomerLedger {
  customer: { _id: string; name: string; phone: string };
  openingBalance: number;
  closingBalance: number;
  transactions: LedgerTransaction[];
  balance: LedgerBalance;
}

export interface MonthlyLedgerSummary {
  year: number;
  month: number;
  openingBalance: number;
  creditSales: number;
  paymentsReceived: number;
  debitAdjustments: number;
  creditAdjustments: number;
  closingBalance: number;
  balance: LedgerBalance;
  transactions: LedgerTransaction[];
}

export interface CreatePaymentPayload {
  amount: number;
  paymentDate?: string;
  paymentMode: LedgerPaymentMode;
  reference?: string;
  description?: string;
  force?: boolean;
}

export interface CreatePaymentResult {
  transaction: LedgerTransaction;
  balanceBefore: number;
  balanceAfter: number;
}

export interface CreateAdjustmentPayload {
  amount: number;
  adjustmentType: LedgerAdjustmentType;
  reason: string;
  transactionDate?: string;
}

// API error shape for the two special ledger error codes the frontend
// needs to branch on (see ledger.service.js on the backend).
export interface LedgerApiError {
  statusCode: number;
  message: string;
  code?: "CREDIT_OPT_IN_REQUIRED" | "DUPLICATE_PAYMENT_REFERENCE";
  customerId?: string;
}