"use server";

import { authFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  productName: string;
  priceAtPurchase: string;
  quantity: number;
  subtotal: string;
}

export interface OrderResponse {
  id: string;
  status: string;
  totalAmount: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  id: string;
  provider: string;
  status: string;
  amount: string;
  currency: string;
  checkoutUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

interface SessionResult {
  success: boolean;
  order?: OrderResponse;
  error?: string;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createCheckoutSession(
  accessToken: string,
): Promise<CheckoutResult> {
  try {
    if (!accessToken) {
      return { success: false, error: "Please sign in to checkout" };
    }

    const order = await authFetch<OrderResponse>("/orders", accessToken, {
      method: "POST",
    });

    const payment = await authFetch<PaymentResponse>(
      `/payments/${order.id}/checkout`,
      accessToken,
      { method: "POST" },
    );

    return { success: true, checkoutUrl: payment.checkoutUrl };
  } catch (error) {
    console.error("[createCheckoutSession]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function getCheckoutSession(
  orderId: string,
  accessToken: string,
): Promise<SessionResult> {
  try {
    if (!accessToken) {
      return { success: false, error: "Not authenticated" };
    }

    if (!orderId) {
      return { success: false, error: "Order not found" };
    }

    const order = await authFetch<OrderResponse>(
      `/orders/${orderId}`,
      accessToken,
    );

    return { success: true, order };
  } catch (error) {
    console.error("[getCheckoutSession]", error);
    return { success: false, error: "Could not retrieve order details" };
  }
}

interface PaymentResult {
  success: boolean;
  payment?: PaymentResponse;
  error?: string;
}

export async function getPayment(
  orderId: string,
  accessToken: string,
): Promise<PaymentResult> {
  try {
    if (!accessToken) {
      return { success: false, error: "Not authenticated" };
    }

    const payment = await authFetch<PaymentResponse>(
      `/payments/${orderId}`,
      accessToken,
    );

    return { success: true, payment };
  } catch (error) {
    console.error("[getPayment]", error);
    return { success: false, error: "Could not retrieve payment details" };
  }
}
