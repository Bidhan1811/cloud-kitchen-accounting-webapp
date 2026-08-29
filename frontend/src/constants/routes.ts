export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  SALES: "/sales",
  EXPENDITURE: "/expenditure",
  CUSTOMERS: "/customers",
  CUSTOMER: (id: string) => `/customers/${id}`,
  LEDGER: "/ledger",
  LEDGER_CUSTOMER: (id: string) => `/ledger/${id}`,
  MENU: "/menu",
  REPORTS: "/reports",
  SETTINGS: "/settings",
} as const;
