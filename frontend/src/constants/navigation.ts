import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Users,
  UtensilsCrossed,
  BarChart2,
  Settings,
  BookOpen,
  Home,
} from "lucide-react";
import { ROUTES } from "./routes";

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: ROUTES.DASHBOARD, adminOnly: true },
  { label: "Sales", icon: ShoppingBag, href: ROUTES.SALES },
  { label: "Expenditure", icon: Receipt, href: ROUTES.EXPENDITURE },
  { label: "Home Expenses", icon: Home, href: ROUTES.HOME_EXPENSES, adminOnly: true },
  { label: "Customers", icon: Users, href: ROUTES.CUSTOMERS, adminOnly: true },
  { label: "Ledgers", icon: BookOpen, href: ROUTES.LEDGER, adminOnly: true },
  { label: "Menu", icon: UtensilsCrossed, href: ROUTES.MENU, adminOnly: true },
  { label: "Reports", icon: BarChart2, href: ROUTES.REPORTS, adminOnly: true },
  { label: "Settings", icon: Settings, href: ROUTES.SETTINGS },
];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 5); // Dashboard, Sales, Expenditure, Customers, Menu
