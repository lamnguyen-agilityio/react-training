"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { getPayment } from "@/lib/actions/checkout";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";
import type { PaymentResponse } from "@/lib/actions/checkout";
import { useCartStore } from "@/lib/store/cart-store-provider";

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const accessToken = useAuthUserStore(selectAccessToken);
  const clearCart = useCartStore((s) => s.clearCart);

  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderId || !accessToken) {
      setLoading(false);
      return;
    }

    getPayment(orderId, accessToken).then((result) => {
      if (result.success && result.payment) {
        setPayment(result.payment);
      }
      setLoading(false);
    });
  }, [orderId, accessToken]);

  const handleRetry = () => {
    if (!payment?.checkoutUrl) return;
    setRetrying(true);
    window.location.href = payment.checkoutUrl;
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-400" />
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Payment Failed
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Your payment was not completed. You can try again or return to
          shopping.
        </p>
      </div>

      {/* Order info */}
      {loading ? (
        <div className="mt-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <span className="ml-2 text-sm text-zinc-500">
            Loading order details...
          </span>
        </div>
      ) : payment ? (
        <div className="mt-10 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Order Summary
            </h2>
          </div>

          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Order ID</span>
              <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                {orderId}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Amount</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatPrice(parseFloat(payment.amount))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Status</span>
              <span className="capitalize font-medium text-red-500">
                {payment.status}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {payment?.checkoutUrl && (
          <Button
            onClick={handleRetry}
            disabled={retrying}
            className="sm:order-first"
          >
            {retrying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Try Again
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
