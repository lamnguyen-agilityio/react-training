"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { CartItem } from "@/lib/store/cart-store";
import { getProductBySlug } from "@/lib/api";

export interface StockInfo {
  productId: string;
  currentStock: number;
  isOutOfStock: boolean;
  exceedsStock: boolean;
  availableQuantity: number;
}

export type StockMap = Map<string, StockInfo>;

interface UseCartStockReturn {
  stockMap: StockMap;
  isLoading: boolean;
  hasStockIssues: boolean;
  refetch: () => void;
}

export function useCartStock(items: CartItem[]): UseCartStockReturn {
  const [stockMap, setStockMap] = useState<StockMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const fetchedSlugsRef = useRef<Set<string>>(new Set());

  const fetchStock = useCallback(
    async (slugsToFetch: string[], allItems: CartItem[]) => {
      if (slugsToFetch.length === 0) return;

      setIsLoading(true);
      try {
        const products = await Promise.all(
          slugsToFetch.map((slug) => getProductBySlug(slug)),
        );

        setStockMap((prev) => {
          const next = new Map(prev);
          for (const product of products) {
            const cartItem = allItems.find((i) => i.slug === product.slug);
            if (!cartItem) continue;

            next.set(cartItem.productId, {
              productId: cartItem.productId,
              currentStock: product.quantityInStock ?? 0,
              isOutOfStock: (product.quantityInStock ?? 0) === 0,
              exceedsStock: cartItem.quantity > (product.quantityInStock ?? 0),
              availableQuantity: Math.min(
                cartItem.quantity,
                product.quantityInStock ?? 0,
              ),
            });

            fetchedSlugsRef.current.add(product.slug);
          }
          return next;
        });
      } catch (error) {
        console.error("[useCartStock] Failed to fetch stock:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const slugKey = items.map((i) => i.slug).join(",");

  useEffect(() => {
    if (items.length === 0) {
      setStockMap(new Map());
      fetchedSlugsRef.current.clear();
      return;
    }

    const newSlugs = items
      .map((i) => i.slug)
      .filter((slug) => !fetchedSlugsRef.current.has(slug));

    if (newSlugs.length > 0) {
      fetchStock(newSlugs, items);
    }

    const currentProductIds = new Set(items.map((i) => i.productId));
    setStockMap((prev) => {
      const removedKeys = [...prev.keys()].filter(
        (id) => !currentProductIds.has(id),
      );
      if (removedKeys.length === 0) return prev;
      const next = new Map(prev);
      removedKeys.forEach((id) => next.delete(id));
      return next;
    });
  }, [slugKey, fetchStock]);

  const quantityKey = items
    .map((i) => `${i.productId}:${i.quantity}`)
    .join(",");

  useEffect(() => {
    if (stockMap.size === 0) return;

    setStockMap((prev) => {
      let changed = false;
      const next = new Map(prev);

      for (const item of items) {
        const info = next.get(item.productId);
        if (!info) continue;

        const exceedsStock = item.quantity > info.currentStock;
        const availableQuantity = Math.min(item.quantity, info.currentStock);

        if (
          info.exceedsStock !== exceedsStock ||
          info.availableQuantity !== availableQuantity
        ) {
          next.set(item.productId, {
            ...info,
            exceedsStock,
            availableQuantity,
          });
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [quantityKey]);

  const refetch = useCallback(() => {
    fetchedSlugsRef.current.clear();
    fetchStock(
      items.map((i) => i.slug),
      items,
    );
  }, [items, fetchStock]);

  const hasStockIssues = [...stockMap.values()].some(
    (info) => info.isOutOfStock || info.exceedsStock,
  );

  return { stockMap, isLoading, hasStockIssues, refetch };
}
