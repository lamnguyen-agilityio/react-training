"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";

interface StockInputProps {
  productId: string;
  initialStock: number;
}

export function StockInput({ productId, initialStock }: StockInputProps) {
  const accessToken = useAuthUserStore(selectAccessToken);
  const [value, setValue] = useState(initialStock);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOutOfStock = value === 0;
  const isLowStock = value > 0 && value <= 5;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseInt(e.target.value) || 0;
    setValue(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!accessToken) return;
      setSaving(true);
      try {
        await authFetch(`/products/${productId}`, accessToken, {
          method: "PATCH",
          body: { quantityInStock: next },
        });
      } catch (err) {
        console.error("[StockInput] patch failed:", err);
        setValue(initialStock); // rollback
      } finally {
        setSaving(false);
      }
    }, 600);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return (
    <Input
      type="number"
      min={0}
      value={value}
      onChange={handleChange}
      disabled={saving}
      className={cn(
        "h-8 w-20 text-center",
        isOutOfStock &&
          "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
        isLowStock &&
          "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
      )}
    />
  );
}

export function StockInputSkeleton() {
  return <Skeleton className="h-8 w-20" />;
}
