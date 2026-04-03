"use client";

import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { OrderResponse } from "@/lib/actions/checkout";

interface SuccessClientProps {
  order: OrderResponse;
}

export function SuccessClient({ order }: SuccessClientProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Thank you for your purchase. Your order is being processed.
        </p>
      </div>

      {/* Order Details */}
      <div className="mt-10 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Order Details
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Order ID: {order.id}
          </p>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatPrice(parseFloat(item.subtotal))}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-zinc-900 dark:text-zinc-100">Total</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {formatPrice(parseFloat(order.totalAmount))}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Status:{" "}
              <span className="font-medium capitalize text-green-600">
                {order.status}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/orders">
            View Your Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
