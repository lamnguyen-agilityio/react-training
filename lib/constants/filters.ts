// ============================================
// Product Attribute Constants
// Shared between frontend filters and Sanity schema
// ============================================

export const COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "oak", label: "Oak" },
  { value: "walnut", label: "Walnut" },
  { value: "grey", label: "Grey" },
  { value: "natural", label: "Natural" },
] as const;

export const MATERIALS = [
  { value: "wood", label: "Wood" },
  { value: "metal", label: "Metal" },
  { value: "fabric", label: "Fabric" },
  { value: "leather", label: "Leather" },
  { value: "glass", label: "Glass" },
] as const;

export const SORT_OPTIONS = [
  {
    key: "createdAt_asc",
    sortBy: "createdAt",
    sortOrder: "asc",
    label: "Date: Oldest first",
  },
  {
    key: "createdAt_desc",
    sortBy: "createdAt",
    sortOrder: "desc",
    label: "Date: Newest first",
  },
  { key: "name_asc", sortBy: "name", sortOrder: "asc", label: "Name (A-Z)" },
  { key: "name_desc", sortBy: "name", sortOrder: "desc", label: "Name (Z-A)" },
  {
    key: "price_asc",
    sortBy: "price",
    sortOrder: "asc",
    label: "Price: Low to High",
  },
  {
    key: "price_desc",
    sortBy: "price",
    sortOrder: "desc",
    label: "Price: High to Low",
  },
] as const;

// Type exports
export type ColorValue = (typeof COLORS)[number]["value"];
export type MaterialValue = (typeof MATERIALS)[number]["value"];
// export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ============================================
// Sanity Schema Format Exports
// Format compatible with Sanity's options.list
// ============================================

/** Colors formatted for Sanity schema options.list */
export const COLORS_SANITY_LIST = COLORS.map(({ value, label }) => ({
  title: label,
  value,
}));

/** Materials formatted for Sanity schema options.list */
export const MATERIALS_SANITY_LIST = MATERIALS.map(({ value, label }) => ({
  title: label,
  value,
}));

/** Color values array for zod enums or validation */
export const COLOR_VALUES = COLORS.map((c) => c.value) as [
  ColorValue,
  ...ColorValue[],
];

/** Material values array for zod enums or validation */
export const MATERIAL_VALUES = MATERIALS.map((m) => m.value) as [
  MaterialValue,
  ...MaterialValue[],
];
