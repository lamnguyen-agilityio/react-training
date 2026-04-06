"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";
import { Category, Product } from "@/lib/api";

interface ProductSectionProps {
  categories: Category[];
  products: Product[];
  searchQuery: string;
  total: number;
  onLoadMore?: () => Promise<void>;
  fetching?: boolean;
}

export function ProductSection({
  categories,
  products,
  searchQuery,
  total,
  onLoadMore,
  fetching = false,
}: ProductSectionProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = products.length < total;

  const handleLoadMore = async () => {
    if (!onLoadMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {total} {total === 1 ? "product" : "products"} found
          {searchQuery && (
            <span>
              {" "}for &quot;<span className="font-medium">{searchQuery}</span>&quot;
            </span>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 border-zinc-300 bg-white shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          aria-label={filtersOpen ? "Hide filters" : "Show filters"}
        >
          {filtersOpen ? (
            <><PanelLeftClose className="h-4 w-4" /><span className="hidden sm:inline">Hide Filters</span><span className="sm:hidden">Hide</span></>
          ) : (
            <><PanelLeft className="h-4 w-4" /><span className="hidden sm:inline">Show Filters</span><span className="sm:hidden">Filters</span></>
          )}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside
          className={`shrink-0 transition-all duration-300 ease-in-out ${
            filtersOpen ? "w-full lg:w-72 lg:opacity-100" : "hidden lg:hidden"
          }`}
        >
          <ProductFilters categories={categories} />
        </aside>

        <main className="flex flex-1 flex-col gap-6 transition-all duration-300">
          <div className={`transition-opacity duration-200 ${fetching ? "opacity-50 pointer-events-none" : ""}`}>
            <ProductGrid products={products} />
          </div>

          {/* Load More */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-32"
              >
                {loadingMore ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>
                ) : (
                  `Load More (${total - products.length} remaining)`
                )}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
