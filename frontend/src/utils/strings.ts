/**
 * Get initials from a name.
 * "Rohit Singh" → "RS"
 */
export const generateInitials = (name: string): string => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join("");
};

/**
 * Truncate a string to maxLength with ellipsis.
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
};

/**
 * Capitalize first letter.
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate a consistent background color from a string (for avatars).
 */
export const stringToColor = (str: string): string => {
  const colors = [
    "rgba(200,135,58,0.20)",
    "rgba(76,154,110,0.20)",
    "rgba(192,82,74,0.15)",
    "rgba(100,80,200,0.15)",
    "rgba(184,134,46,0.20)",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
