"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ProductSection } from "./ProductSection";
import { getProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/api";

interface HomeProductSectionProps {
  categories: Category[];
  initialProducts: Product[];
  initialTotal: number;
  initialSearchQuery: string;
}

const LIMIT = 10;

export function HomeProductSection({
  categories,
  initialProducts,
  initialTotal,
  initialSearchQuery,
}: HomeProductSectionProps) {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(false);

  // Track previous params to detect changes
  const paramsKey = searchParams.toString();
  const prevParamsKey = useRef(paramsKey);

  const getFilters = useCallback(
    () => ({
      search: searchParams.get("search") || undefined,
      categorySlug: searchParams.get("categorySlug") || undefined,
      minPrice: Number(searchParams.get("minPrice")) || undefined,
      maxPrice: Number(searchParams.get("maxPrice")) || undefined,
      sortBy: searchParams.get("sortBy") ?? "name",
      sortOrder: searchParams.get("sortOrder") ?? "desc",
    }),
    [searchParams],
  );

  // When URL params change → fetch page 1 client-side (no scroll jump)
  useEffect(() => {
    if (paramsKey === prevParamsKey.current) return;
    prevParamsKey.current = paramsKey;

    setFetching(true);
    getProducts({ ...getFilters(), page: 1, limit: LIMIT })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.total);
        setPage(1);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [paramsKey, getFilters]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const res = await getProducts({
      ...getFilters(),
      page: nextPage,
      limit: LIMIT,
    });
    setProducts((prev) => [...prev, ...res.items]);
    setPage(nextPage);
  };

  return (
    <ProductSection
      categories={categories}
      products={products}
      searchQuery={searchParams.get("search") ?? initialSearchQuery}
      total={total}
      onLoadMore={handleLoadMore}
      fetching={fetching}
    />
  );
}
