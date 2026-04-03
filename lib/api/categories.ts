/**
 * lib/api/categories.ts
 * ──────────────────────
 * All category-related API calls.
 * Public — no auth required.
 */

import { publicGet } from "./client";
import type { Category } from "./types";

/**
 * Fetch all categories.
 * Long cache — categories rarely change.
 */
export async function getCategories(): Promise<Category[]> {
  return publicGet<Category[]>("/categories", {
    revalidate: 600,
    tags: ["categories"],
  });
}

/**
 * Fetch a single category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category> {
  return publicGet<Category>(`/categories/${slug}`, {
    revalidate: 600,
    tags: ["categories", `category-${slug}`],
  });
}
