/**
 * Format a number as Indian Rupees.
 * e.g. 8450 → ₹8,450
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a number as compact Indian Rupees.
 * e.g. 24680 → ₹24.7K
 */
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
};

/**
 * Parse a formatted currency string back to number.
 */
export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[₹,]/g, "")) || 0;
};
