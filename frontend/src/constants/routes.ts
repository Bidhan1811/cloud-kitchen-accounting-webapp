export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  SALES: "/sales",
  EXPENDITURE: "/expenditure",
  CUSTOMERS: "/customers",
  CUSTOMER: (id: string) => `/customers/${id}`,
  MENU: "/menu",
  REPORTS: "/reports",
  SETTINGS: "/settings",
} as const;
