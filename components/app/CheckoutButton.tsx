"use client";

import { useState, useTransition } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/checkout";
import { useAuthUserStore, selectAccessToken } from "@/lib/store/auth-user.store";

interface CheckoutButtonProps {
  disabled?: boolean;
  onError?: () => void;
}

export function CheckoutButton({ disabled, onError }: CheckoutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthUserStore(selectAccessToken);

  const handleCheckout = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(accessToken ?? "");
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        const msg = result.error ?? "Checkout failed";
        setError(msg);
        toast.error("Checkout Error", { description: msg });
        onError?.();
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
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
        ) : (
          <><CreditCard className="mr-2 h-5 w-5" />Pay with Stripe</>
        )}
      </Button>
      {error && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
