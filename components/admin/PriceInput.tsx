"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";

interface PriceInputProps {
  productId: string;
  initialPrice: string;
  currency?: string;
}

export function PriceInput({
  productId,
  initialPrice,
  currency = "$",
}: PriceInputProps) {
  const accessToken = useAuthUserStore(selectAccessToken);
  const [value, setValue] = useState(parseFloat(initialPrice) || 0);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value) || 0;
    setValue(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!accessToken) return;
      setSaving(true);
      try {
        await authFetch(`/products/${productId}`, accessToken, {
          method: "PATCH",
          body: { price: String(next) },
        });
      } catch (err) {
        console.error("[PriceInput] patch failed:", err);
        setValue(parseFloat(initialPrice) || 0); // rollback
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
    <div className="flex items-center gap-1">
      <span className="text-sm text-zinc-500">{currency}</span>
      <Input
        type="number"
        min={0}
        step={0.01}
        value={value}
        onChange={handleChange}
        disabled={saving}
        className="h-8 w-24 text-right"
      />
    </div>
  );
}

export function PriceInputSkeleton() {
  return <Skeleton className="h-8 w-24" />;
}
