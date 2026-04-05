"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SuccessClient } from "./SuccessClient";
import { getCheckoutSession } from "@/lib/actions/checkout";
import {
  useAuthUserStore,
  selectAccessToken,
  selectAuthStatus,
} from "@/lib/store/auth-user.store";
import type { OrderResponse } from "@/lib/actions/checkout";
import { useCartStore } from "@/lib/store/cart-store-provider";

const REHYDRATE_TIMEOUT_MS = 3000;

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const accessToken = useAuthUserStore(selectAccessToken);
  const authStatus = useAuthUserStore(selectAuthStatus);
  const clearCart = useCartStore((s) => s.clearCart);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), REHYDRATE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const isRehydrating = authStatus === "idle" || authStatus === "loading";
    if (isRehydrating && !timedOut) return;

    if (!orderId || !accessToken) {
      router.replace("/");
      return;
    }

    getCheckoutSession(orderId, accessToken).then((result) => {
      if (result.success && result.order) {
        setOrder(result.order);
      } else {
        router.replace("/");
      }
      setLoading(false);
    });
  }, [orderId, accessToken, authStatus, timedOut, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!order) return null;

  return <SuccessClient order={order} />;
}
