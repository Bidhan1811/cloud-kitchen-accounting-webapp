import dayjs from "dayjs";

/**
 * Format date for display: "26 Apr 2025"
 */
export const formatDate = (date: string | Date): string => {
  return dayjs(date).format("D MMM YYYY");
};

/**
 * Format date with time: "26 Apr 2025, 7:40 PM"
 */
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format("D MMM YYYY, h:mm A");
};

/**
 * Format for input[type=date]: "2025-04-26"
 */
export const formatDateInput = (date: string | Date): string => {
  return dayjs(date).format("YYYY-MM-DD");
};

/**
 * Relative time: "2 days ago"
 */
export const formatRelative = (date: string | Date): string => {
  const diff = dayjs().diff(dayjs(date), "day");
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return formatDate(date);
};

/**
 * Month range label: "1 – 30 Apr 2025"
 */
export const formatMonthRange = (date?: string | Date): string => {
  const d = date ? dayjs(date) : dayjs();
  const start = d.startOf("month").format("D");
  const end = d.endOf("month").format("D MMM YYYY");
  return `${start} – ${end}`;
};

/**
 * Get greeting based on time of day.
 */
export const getGreeting = (): string => {
  const hour = dayjs().hour();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};
