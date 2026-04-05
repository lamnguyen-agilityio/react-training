"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  image?: string;
  quantityInStock: number;
}

interface ProductsResponse {
  total: number;
  page: number;
  limit: number;
  items: Product[];
}

const LOW_STOCK_THRESHOLD = 5;

// ── Row ───────────────────────────────────────────────────────────────────────

function LowStockProductRow({ product }: { product: Product }) {
  const isOutOfStock = product.quantityInStock === 0;

  return (
    <Link
      href={`/admin/inventory/${product.id}`}
      className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3 transition-colors hover:border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-700">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            ?
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {product.name}
        </p>
      </div>

      <Badge
        variant={isOutOfStock ? "destructive" : "secondary"}
        className="shrink-0"
      >
        {isOutOfStock ? "Out of stock" : `${product.quantityInStock} left`}
      </Badge>
    </Link>
  );
}

function LowStockProductRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
      <Skeleton className="h-10 w-10 rounded-md" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

function LowStockAlertContent() {
  const accessToken = useAuthUserStore(selectAccessToken);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    authFetch<ProductsResponse>("/products", accessToken)
      .then((res) => {
        const lowStock = res.items
          .filter((p) => p.quantityInStock < LOW_STOCK_THRESHOLD)
          .sort((a, b) => a.quantityInStock - b.quantityInStock);
        setProducts(lowStock);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <LowStockProductRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <span className="text-2xl">✓</span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          All products are well stocked!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.slice(0, 5).map((product) => (
        <LowStockProductRow key={product.id} product={product} />
      ))}
      {products.length > 5 && (
        <Link
          href="/admin/inventory?filter=low-stock"
          className="block text-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          View all {products.length} low stock items →
        </Link>
      )}
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function LowStockAlert() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Low Stock Alerts
        </h2>
      </div>
      <div className="p-4">
        <LowStockAlertContent />
      </div>
    </div>
  );
}
