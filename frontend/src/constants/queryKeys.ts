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

  // Customers
  CUSTOMERS: (filters?: Record<string, any>) => ["customers", filters] as const,
  CUSTOMER: (id: string) => ["customers", id] as const,
  CUSTOMER_ORDERS: (id: string) => ["customers", id, "orders"] as const,

  // Menu
  MENU_ITEMS: (filters?: Record<string, any>) => ["menu-items", filters] as const,
  MENU_ITEM: (id: string) => ["menu-items", id] as const,

  // Auth
  ME: ["auth", "me"] as const,
} as const;
