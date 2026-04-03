"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { StockBadge } from "@/components/app/StockBadge";
import { Product } from "@/lib/api";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(
    null,
  );

  const image = product.image;
  const stock = product.quantityInStock ?? 0;
  const isOutOfStock = stock <= 0;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-sm ring-1 ring-zinc-950/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/10 dark:bg-zinc-900 dark:ring-white/10 dark:hover:shadow-zinc-950/50">
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden bg-linear-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 aspect-4/5",
          )}
        >
          <Image
            src={image}
            alt={product.name ?? "Product image"}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          {/* Gradient overlay for text contrast */}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {isOutOfStock && (
            <Badge
              variant="destructive"
              className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium shadow-lg"
            >
              Out of Stock
            </Badge>
          )}
          {product.category && (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-300">
              {product.category.name}
            </span>
          )}
        </div>
      </Link>

      <CardContent className="flex grow flex-col justify-between gap-2 p-5">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-zinc-900 transition-colors group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatPrice(product.price)}
          </p>
          <StockBadge productId={product.id} stock={stock} />
        </div>
      </CardContent>

      <CardFooter className="mt-auto p-5 pt-0">
        <AddToCartButton
          productId={product.id}
          name={product.name ?? "Unknown Product"}
          price={product.price ?? 0}
          image={image ?? undefined}
          stock={stock}
          slug={product.slug}
        />
      </CardFooter>
    </Card>
  );
}
