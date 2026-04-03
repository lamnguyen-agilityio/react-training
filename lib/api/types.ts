/**
 * lib/api/types.ts
 * ─────────────────
 * Shared domain types used across all API services.
 * Adjust fields to match your actual backend response shapes.
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  quantityInStock: number;
  category: Category;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ── Query params ─────────────────────────────────────────────────────────────

export interface ProductsQuery {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

// ── Paginated response wrapper (adjust to your API's shape) ──────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
