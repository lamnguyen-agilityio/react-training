// app/admin/inventory/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody } from "@/components/ui/table";
import {
  ProductRow,
  ProductRowSkeleton,
  AdminSearch,
  ProductTableHeader,
} from "@/components/admin";
import { CreateProductDialog } from "@/components/admin/CreateProductDialog";
import {
  useAuthUserStore,
  selectAccessToken,
  selectAuthStatus,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  image?: string;
  quantityInStock: number;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  total: number;
  page: number;
  limit: number;
  items: Product[];
}

const LIMIT = 20;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProductListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Table>
        <ProductTableHeader />
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <ProductRowSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const router = useRouter();
  const accessToken = useAuthUserStore(selectAccessToken);
  const authStatus = useAuthUserStore(selectAuthStatus);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────

  // Tracks whether the initial load has already fired — prevents the search
  // effect from triggering a second fetch on mount.
  const initialLoadDone = useRef(false);

  // Tracks the previous searchQuery so the search effect only fires on
  // genuine changes, not on the first render.
  const prevSearch = useRef(searchQuery);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(
    async (pageNum: number, q: string, append = false) => {
      if (!accessToken) return;

      const qs = new URLSearchParams({
        page: String(pageNum),
        limit: String(LIMIT),
        ...(q ? { search: q } : {}),
      });

      try {
        const res = await authFetch<ProductsResponse>(
          `/products?${qs}`,
          accessToken,
        );
        setProducts((prev) => (append ? [...prev, ...res.items] : res.items));
        setTotal(res.total);
      } catch (err) {
        console.error("[InventoryPage] fetch failed:", err);
      }
    },
    [accessToken],
  );

  // ── Initial load ──────────────────────────────────────────────────────────
  // Runs once when auth is ready (or timed out). Guards against redirect if
  // no token is present.

  useEffect(() => {
    const rehydrating = authStatus === "idle" || authStatus === "loading";
    if (rehydrating) return; // wait for store to rehydrate

    if (!accessToken) {
      router.replace("/");
      return;
    }

    // Prevent running again if token/status reference changes but we already
    // completed the initial fetch.
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    setLoading(true);
    fetchProducts(1, searchQuery).finally(() => setLoading(false));
    setPage(1);
  }, [accessToken, authStatus, router, fetchProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search ────────────────────────────────────────────────────────────────
  // Debounced. Skips the very first render (initialLoadDone guards that),
  // then fires only when searchQuery actually changes.

  useEffect(() => {
    // Skip until initial load is done to avoid a double-fetch on mount.
    if (!initialLoadDone.current) return;
    // Skip if query hasn't actually changed (e.g., component re-render).
    if (searchQuery === prevSearch.current) return;
    prevSearch.current = searchQuery;

    if (!accessToken) return;

    const t = setTimeout(() => {
      setLoading(true);
      setPage(1);
      fetchProducts(1, searchQuery).finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(t);
  }, [searchQuery, accessToken, fetchProducts]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchProducts(nextPage, searchQuery, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const hasMore = products.length < total;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Manage your product stock and pricing
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      {/* Search */}
      <AdminSearch
        placeholder="Search products..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="w-full sm:max-w-sm"
      />

      {/* List */}
      {loading ? (
        <ProductListSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={searchQuery ? "No products found" : "No products yet"}
          description={
            searchQuery
              ? "Try adjusting your search terms."
              : "Get started by adding your first product."
          }
          action={
            !searchQuery
              ? {
                  label: "Add Product",
                  onClick: () => setDialogOpen(true),
                  icon: Plus,
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <Table>
              <ProductTableHeader />
              <TableBody>
                {products.map((product) => (
                  <ProductRow key={product.slug} product={product as any} />
                ))}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create dialog — rendered outside the list so it doesn't unmount */}
      {accessToken && (
        <CreateProductDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}
