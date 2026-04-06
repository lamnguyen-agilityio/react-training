"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartActions, useCartItem } from "@/lib/store/cart-store-provider";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
  stock: number;
  className?: string;
}

export function AddToCartButton({
  productId,
  name,
  price,
  image,
  slug,
  stock,
  className,
}: AddToCartButtonProps) {
  const { addItem, updateQuantity } = useCartActions();
  const cartItem = useCartItem(productId);
  const quantityInCart = cartItem?.quantity ?? 0;
  const isOutOfStock = stock <= 0;
  const isAtMax = quantityInCart >= stock;

  const [loading, setLoading] = useState(false);

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () =>
    withLoading(async () => {
      if (quantityInCart < stock) {
        await addItem({ productId, name, price, image, slug }, 1);
        toast.success(`Added ${name}`);
      }
    });

  const handleDecrement = () =>
    withLoading(async () => {
      if (quantityInCart > 0) {
        await updateQuantity(productId, quantityInCart - 1);
      }
    });

  const handleIncrement = () =>
    withLoading(async () => {
      if (quantityInCart < stock) {
        await updateQuantity(productId, quantityInCart + 1);
      }
    });

  // Out of stock
  if (isOutOfStock) {
    return (
      <Button
        disabled
        variant="secondary"
        className={cn("h-11 w-full", className)}
      >
        Out of Stock
      </Button>
    );
  }

  // Not in cart
  if (quantityInCart === 0) {
    return (
      <Button
        onClick={handleAdd}
        disabled={loading}
        className={cn("h-11 w-full", className)}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShoppingBag className="mr-2 h-4 w-4" />
        )}
        Add to Basket
      </Button>
    );
  }

  // In cart — quantity controls
  return (
    <div
      className={cn(
        "flex h-11 w-full items-center rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-full flex-1 rounded-r-none"
        onClick={handleDecrement}
        disabled={loading}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <span className="relative flex flex-1 items-center justify-center text-sm font-semibold tabular-nums">
        <span className={loading ? "opacity-0" : ""}>{quantityInCart}</span>
        {loading && <Loader2 className="absolute h-4 w-4 animate-spin" />}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-full flex-1 rounded-l-none disabled:opacity-20"
        onClick={handleIncrement}
        disabled={loading || isAtMax}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
