"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";

interface FeaturedToggleProps {
  productId: string;
  initialFeatured: boolean;
}

export function FeaturedToggle({
  productId,
  initialFeatured,
}: FeaturedToggleProps) {
  const accessToken = useAuthUserStore(selectAccessToken);
  const [featured, setFeatured] = useState(initialFeatured);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    if (!accessToken || saving) return;
    const next = !featured;
    setFeatured(next); // optimistic
    setSaving(true);
    try {
      await authFetch(`/products/${productId}`, accessToken, {
        method: "PATCH",
        body: { featured: next },
      });
    } catch (err) {
      console.error("[FeaturedToggle] patch failed:", err);
      setFeatured(featured); // rollback
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleToggle}
      disabled={saving}
      title={featured ? "Remove from featured" : "Add to featured"}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      ) : (
        <Star
          className={cn(
            "h-4 w-4 transition-colors",
            featured
              ? "fill-amber-400 text-amber-400"
              : "text-zinc-300 dark:text-zinc-600",
          )}
        />
      )}
    </Button>
  );
}

export function FeaturedToggleSkeleton() {
  return <Skeleton className="h-8 w-8" />;
}
