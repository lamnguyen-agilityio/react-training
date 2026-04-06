/**
 * lib/products.ts
 * ────────────────────
 * All product-related API calls.
 * Uses publicGet — no auth required for this page.
 */

import { publicGet } from "./client";
import type { PaginatedResponse, Product, ProductsQuery } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildProductsQuery(params: ProductsQuery): string {
  const qs = new URLSearchParams();

  if (params.search) qs.set("search", params.search);
  if (params.categorySlug) qs.set("categorySlug", params.categorySlug);
  if (params.minPrice) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice) qs.set("maxPrice", String(params.maxPrice));
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const str = qs.toString();
  return str ? `?${str}` : "";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch paginated products with optional filters.
 * Cached for 60 s, tagged so on-demand revalidation works:
 *   revalidateTag("products")
 */
export async function getProducts(
  params: ProductsQuery = {},
): Promise<PaginatedResponse<Product>> {
  const query = buildProductsQuery(params);
  return publicGet<PaginatedResponse<Product>>(`/products${query}`, {
    revalidate: 60,
    tags: ["products"],
  });
}

/**
 * Fetch featured products for the carousel.
 * Longer cache — featured list changes less frequently.
 */
// export async function getFeaturedProducts(): Promise<Product[]> {
//   return publicGet<Product[]>("/products/featured", {
//     revalidate: 300,
//     tags: ["products", "products-featured"],
//   });
// }

/**
 * Fetch a single product by slug.
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  return publicGet<Product>(`/products/${slug}`, {
    revalidate: 60,
    tags: ["products", `product-${slug}`],
  });
}
