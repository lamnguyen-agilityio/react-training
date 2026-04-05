"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";
import { authFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productName: string;
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

interface OrdersResponse {
  total: number;
  page: number;
  limit: number;
  items: Order[];
}

// ── Row ───────────────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: Order }) {
  const status = getOrderStatus(order.status);
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatDate(order.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {formatPrice(parseFloat(order.totalAmount))}
        </p>
        <Badge className={`${status.color} flex items-center gap-1`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      </div>
    </Link>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
      <div className="space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

function RecentOrdersContent() {
  const accessToken = useAuthUserStore(selectAccessToken);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    authFetch<OrdersResponse>("/orders?limit=5", accessToken)
      .then((res) => setOrders(res.items))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <OrderRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <ShoppingCart className="h-6 w-6 text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No orders yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function RecentOrders() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Recent Orders
        </h2>
        <Link
          href="/admin/orders"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          View all →
        </Link>
      </div>
      <div className="p-4">
        <RecentOrdersContent />
      </div>
    </div>
  );
}
