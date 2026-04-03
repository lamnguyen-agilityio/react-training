"use client";

import { useState, useTransition } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/checkout";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";
import { useCartStore } from "@/lib/store/cart-store-provider";

interface CheckoutButtonProps {
  disabled?: boolean;
}

export function CheckoutButton({ disabled }: CheckoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthUserStore(selectAccessToken);
  const clearCart = useCartStore((s) => s.clearCart);

  const handleCheckout = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(accessToken ?? "");

      if (result.success && result.checkoutUrl) {
        clearCart();
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error ?? "Checkout failed");
        toast.error("Checkout Error", {
          description: result.error ?? "Something went wrong",
        });
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={disabled || isPending || !accessToken}
        size="lg"
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pay with Stripe
          </>
        )}
      </Button>

      {error && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
