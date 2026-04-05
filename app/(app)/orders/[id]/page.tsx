"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  useAuthUserStore,
  selectAccessToken,
  selectAuthStatus,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  priceAtPurchase: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface PaymentInfo {
  id: string;
  provider: string;
  status: string;
  amount: string;
  currency: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const accessToken = useAuthUserStore(selectAccessToken);
  const authStatus = useAuthUserStore(selectAuthStatus);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const isRehydrating = authStatus === "idle" || authStatus === "loading";
    if (isRehydrating && !timedOut) return;

    if (!accessToken) {
      router.replace("/");
      return;
    }

    authFetch<Order>(`/orders/${params.id}`, accessToken)
      .then((res) => {
        setOrder(res);
        // Nếu pending → fetch payment để lấy checkoutUrl
        if (res.status === "pending") {
          return authFetch<PaymentInfo>(`/payments/${params.id}`, accessToken)
            .then(setPayment)
            .catch(() => {}); // payment có thể chưa tạo — ignore
        }
      })
      .catch(() => router.replace("/orders"))
      .finally(() => setLoading(false));
  }, [accessToken, authStatus, timedOut, params.id, router]);

  const handleRetryPayment = () => {
    if (!payment?.checkoutUrl) return;
    setRetrying(true);
    window.location.href = payment.checkoutUrl;
  };

  if (!order) return null;

  const status = getOrderStatus(order.status);
  const StatusIcon = status.icon;
  const isPending = order.status === "pending";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/orders"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className={`${status.color} flex items-center gap-1.5`}>
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Order Items */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Items ({order.items.length})
              </h2>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 px-6 py-4">
                  {/* Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.productName}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatPrice(parseFloat(item.subtotal))}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-sm text-zinc-500">
                        {formatPrice(parseFloat(item.priceAtPurchase))} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Summary */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Order Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Subtotal
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(parseFloat(order.totalAmount))}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    Total
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {formatPrice(parseFloat(order.totalAmount))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Payment
              </h2>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-light tracking-wide text-zinc-500">
                  Status
                </span>
                <span
                  className={`text-sm font-medium capitalize ${isPending ? "text-amber-500" : "text-green-600"}`}
                >
                  {order.status}
                </span>
              </div>

              {/* Retry button — chỉ hiện khi pending và có checkoutUrl */}
              {isPending && payment?.checkoutUrl && (
                <Button
                  onClick={handleRetryPayment}
                  disabled={retrying}
                  className="w-full"
                  size="sm"
                >
                  {retrying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Complete Payment
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
