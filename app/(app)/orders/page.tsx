"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
  priceAtPurchase: string;
  quantity: number;
  subtotal: string;
  productImage?: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  total: number;
  page: number;
  limit: number;
  items: Order[];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const accessToken = useAuthUserStore(selectAccessToken);
  const authStatus = useAuthUserStore(selectAuthStatus);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const isRehydrating = authStatus === "idle" || authStatus === "loading";
    if (isRehydrating && !timedOut) return;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    authFetch<OrdersResponse>("/orders", accessToken)
      .then((res) => setOrders(res.items))
      .catch((err) => console.error("[OrdersPage]", err))
      .finally(() => setLoading(false));
  }, [accessToken, authStatus, timedOut]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // ── Empty ───────────────────────────────────────────────────────────────────

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={{ label: "Start Shopping", href: "/" }}
          size="lg"
        />
      </div>
    );
  }

  // ── List ────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Your Orders
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Track and manage your orders
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const status = getOrderStatus(order.status);
          const StatusIcon = status.icon;
          const itemNames = order.items.map((i) => i.productName);
          const totalItems = order.items.reduce(
            (sum, i) => sum + i.quantity,
            0,
          );

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="group block rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <div className="flex gap-5 p-5">
                {/* Images stack */}
                <div className="relative flex shrink-0">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative h-16 w-16 overflow-hidden rounded-lg border-2 border-white bg-zinc-100 dark:border-zinc-900 dark:bg-zinc-800"
                      style={{ marginLeft: idx > 0 ? "-20px" : 0, zIndex: idx }}
                    >
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div
                      className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-zinc-100 text-xs font-medium text-zinc-500 dark:border-zinc-900 dark:bg-zinc-800"
                      style={{ marginLeft: "-20px", zIndex: 3 }}
                    >
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  {/* Top: Order Info + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge
                      className={`${status.color} flex shrink-0 items-center gap-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Bottom: Items + Total */}
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatPrice(parseFloat(order.totalAmount))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer: Item names + View link */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {itemNames.slice(0, 2).join(", ")}
                  {itemNames.length > 2 && "..."}
                </p>
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100">
                  View order
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
