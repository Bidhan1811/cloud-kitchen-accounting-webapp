export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "credit", label: "Credit (Khata)" },
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number]["value"];

export const EXPENSE_CATEGORIES = [
  { value: "raw_material", label: "Raw Material" },
  { value: "groceries", label: "Groceries" },
  { value: "packaging", label: "Packaging" },
  { value: "utilities", label: "Utilities" },
  { value: "miscellaneous", label: "Miscellaneous" },
  { value: "salary", label: "Salary" },
  { value: "rent", label: "Rent" },
  { value: "equipment", label: "Equipment" },
  { value: "marketing", label: "Marketing" },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]["value"];

export const SALE_STATUS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
] as const;

export const MENU_CATEGORIES = [
  { value: "Rotis", label: "Rotis" },
  { value: "Rice", label: "Rice" },
  { value: "Indian Gravys", label: "Indian Gravys" },
  { value: "Sabji", label: "Sabji" },
  { value: "Special Items", label: "Special Items" },
  { value: "Seasonal Specials - Rotis", label: "Seasonal Specials - Rotis" },
  { value: "Seasonal Specials - Sabji", label: "Seasonal Specials - Sabji" },
  { value: "Sweets & Snacks", label: "Sweets & Snacks" },
] as const;
