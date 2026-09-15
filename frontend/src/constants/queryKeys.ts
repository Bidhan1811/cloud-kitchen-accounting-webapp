export const QUERY_KEYS = {
  // Dashboard
  DASHBOARD_SUMMARY: ["dashboard", "summary"] as const,
  DASHBOARD_CHART: (period: string) => ["dashboard", "chart", period] as const,
  DASHBOARD_TOP_ITEMS: ["dashboard", "top-items"] as const,
  DASHBOARD_RECENT_SALES: ["dashboard", "recent-sales"] as const,

  // Sales
  SALES: (filters?: Record<string, any>) => ["sales", filters] as const,
  SALE: (id: string) => ["sales", id] as const,

  // Expenditure
  EXPENDITURES: (filters?: Record<string, any>) => ["expenditures", filters] as const,
  EXPENDITURE: (id: string) => ["expenditures", id] as const,

  // Home Expenditure
  HOME_EXPENDITURES: (filters?: Record<string, any>) => ["home-expenditures", filters] as const,
  HOME_EXPENDITURE: (id: string) => ["home-expenditures", id] as const,

  // Customers
  CUSTOMERS: (filters?: Record<string, any>) => ["customers", filters] as const,
  CUSTOMER: (id: string) => ["customers", id] as const,
  CUSTOMER_ORDERS: (id: string) => ["customers", id, "orders"] as const,

  // Customer Credit Ledger
  CUSTOMER_LEDGER: (id: string, range?: { startDate?: string; endDate?: string }) =>
    ["customers", id, "ledger", range] as const,
  CUSTOMER_LEDGER_SUMMARY: (id: string, year: number, month: number) =>
    ["customers", id, "ledger", "summary", year, month] as const,
  CREDIT_CUSTOMERS: (filters?: Record<string, any>) =>
    ["customers", "credit", filters] as const,

  // Menu
  MENU_ITEMS: (filters?: Record<string, any>) => ["menu-items", filters] as const,
  MENU_ITEM: (id: string) => ["menu-items", id] as const,

  // Auth
  ME: ["auth", "me"] as const,
} as const;