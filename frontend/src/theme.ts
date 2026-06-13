export const colors = {
  surface: "#FFFFFF",
  onSurface: "#0F172A",
  surfaceSecondary: "#F8FAFC",
  onSurfaceSecondary: "#334155",
  surfaceTertiary: "#F1F5F9",
  onSurfaceTertiary: "#475569",
  surfaceInverse: "#021013",
  onSurfaceInverse: "#FFFFFF",
  brand: "#0A2528",
  brandPrimary: "#0A2528",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#153E45",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#E5F0F2",
  onBrandTertiary: "#0A2528",
  success: "#166534",
  warning: "#854D0E",
  error: "#991B1B",
  info: "#1E3A8A",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const font = {
  display: "Playfair Display",
  text: "Satoshi",
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const formatINR = (n: number): string => {
  if (n >= 10000000) return `\u20B9${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(0)}K`;
  return `\u20B9${n}`;
};
