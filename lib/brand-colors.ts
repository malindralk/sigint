/**
 * MALINDRA Brand Colors — JS Constants
 * Single source of truth for chart/SVG contexts where CSS variables cannot be used.
 * These MUST match .brand/tokens.css exactly.
 */

export const BRAND = {
  // Backgrounds
  bgBase: "#0A0A0D",
  bgSurface: "#16151B",
  bgElevated: "#27262D",

  // Text
  textPrimary: "#F2E8D0",
  textSecondary: "#C0B298",
  textMuted: "#857B6C",

  // Borders
  border: "rgba(74, 72, 82, 0.42)",
  borderStrong: "rgba(74, 72, 82, 0.65)",
  borderSolid: "#49474F",

  // Brand
  primary: "#922438",    // Sinha Maroon
  accent: "#D49628",     // Temple Gold

  // Semantic
  success: "#28805E",    // Water Fortress
  danger: "#BE3348",     // War Banner
  info: "#3D74A8",       // Zheng He Blue
} as const;

/** Chart color palette — ordered for visual distinctiveness */
export const CHART_COLORS = [
  BRAND.primary,   // Sinha Maroon
  BRAND.info,      // Zheng He Blue
  BRAND.accent,    // Temple Gold
  BRAND.danger,    // War Banner
  BRAND.success,   // Water Fortress
  BRAND.textMuted, // Warm Stone (neutral)
] as const;
