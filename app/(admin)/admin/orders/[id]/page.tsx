"use client";

import { Suspense, useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  ExternalLink,
  Edit2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StatusSelect,
  AddressEditor,
  PublishButton,
  RevertButton,
} from "@/components/admin";
import { formatPrice, formatDate } from "@/lib/utils";
import { authFetch } from "@/lib/api/client";
import {
  useAuthUserStore,
  selectAccessToken,
} from "@/lib/store/auth-user.store";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  productName: string;
  productImage: string;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

function OrderDetailContent({
  orderId,
  accessToken,
}: {
  orderId: string;
  accessToken: string;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!accessToken) return;

      setLoading(true);
      setError(null);

      try {
        const data = await authFetch<OrderDetail>(
          `/orders/${orderId}`,
          accessToken,
        );
        setOrder(data);
      } catch (err: any) {
        console.error("Failed to fetch order detail:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId, accessToken]);

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-500">Order not found or failed to load</p>
        <p className="text-sm text-zinc-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            Order {order.id}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(order.createdAt, "datetime")}
          </p>
        </div>

        {/* Status and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Status: {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        {/* Order Items */}
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4"
                >
                  {/* Image */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 sm:h-20 sm:w-20">
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
                    <div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:text-base">
                          {item.productName ?? "Unknown Product"}
                        </span>
                        {item.productImage && (
                          <Link
                            href={`/products/${item.productName}`}
                            target="_blank"
                            className="shrink-0 text-zinc-400 hover:text-zinc-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                        Qty: {item.quantity} ×{" "}
                        {formatPrice(item.priceAtPurchase)}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:text-base">
                      {formatPrice(item.priceAtPurchase * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Order Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Subtotal
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    Total
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Customer
              </h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="break-all text-zinc-900 dark:text-zinc-100">
                {order.userEmail}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Shipping Address
                </h2>
              </div>
              <Edit2 className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-7 w-40 sm:h-8 sm:w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params); // Next.js 15+ async params
  const accessToken = useAuthUserStore(selectAccessToken);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Link>

      {/* Order Detail */}
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetailContent orderId={id} accessToken={accessToken as string} />
      </Suspense>
    </div>
  );
}
