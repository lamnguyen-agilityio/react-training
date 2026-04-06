"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useAuthUserStore } from "@/lib/store/auth-user.store";
import { getAuthMe } from "@/lib/api/auth";
import { mergeCart, getUserCart } from "@/lib/api/cart";
import type { CartItemResponse } from "@/lib/api/cart";
import type { CartItem } from "@/lib/store/cart-store";
import type { AuthProviderName } from "@/lib/api/auth";

// ── Cart sync helper ──────────────────────────────────────────────────────────

function toCartItem(item: CartItemResponse): CartItem {
  return {
    cartItemId: item.id,
    productId: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    price: parseFloat(String(item.product.price)),
    image: item.product.image,
    quantity: item.quantity,
  };
}

async function syncCartAfterLogin(accessToken: string): Promise<CartItem[]> {
  const CART_STORAGE_KEY = "cart-storage";

  let guestItems: CartItem[] = [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { items?: CartItem[] } };
      guestItems = parsed.state?.items ?? [];
    }
  } catch {}

  const response =
    guestItems.length > 0
      ? await mergeCart(
          { items: guestItems.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
          accessToken,
        )
      : await getUserCart(accessToken);

  const mergedItems = response.items.map(toCartItem);

  // Write to localStorage for persistence across refreshes
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ state: { items: mergedItems }, version: 0 }),
    );
  } catch {}

  return mergedItems;
}

// ── Clerk sync ────────────────────────────────────────────────────────────────

function ClerkTokenSync() {
  const { getToken, isSignedIn, userId } = useAuth();
  const wasSignedIn = useRef<boolean | null>(null);

  const syncToken = useCallback(async () => {
    if (!isSignedIn || !userId) {
      wasSignedIn.current = false;
      useAuthUserStore.setState({
        accessToken: null,
        user: null,
        status: "idle",
        error: null,
      });
      return;
    }

    const token = await getToken();
    if (!token) return;

    try {
      const user = await getAuthMe(token);
      useAuthUserStore.setState({
        accessToken: token,
        user,
        status: "authenticated",
        error: null,
      });
    } catch {
      useAuthUserStore.setState({
        accessToken: token,
        user: { userId, email: "", name: "", role: "user" },
        status: "authenticated",
        error: null,
      });
    }

    // Only sync cart on fresh login transition
    const isFreshLogin = wasSignedIn.current === false || wasSignedIn.current === null;
    wasSignedIn.current = true;

    if (isFreshLogin) {
      try {
        const mergedItems = await syncCartAfterLogin(token);
        window.dispatchEvent(
          new CustomEvent("cart:rehydrate", { detail: { items: mergedItems } }),
        );
      } catch (err) {
        console.error("[ClerkTokenSync] cart sync failed:", err);
      }
    }
  }, [isSignedIn, userId, getToken]);

  useEffect(() => {
    syncToken();
  }, [syncToken]);

  return null;
}

// ── Auth0 sync ────────────────────────────────────────────────────────────────

function Auth0TokenSync() {
  return null;
}

// ── Public export ─────────────────────────────────────────────────────────────

interface AuthTokenSyncProps {
  provider: AuthProviderName;
}

export function AuthTokenSync({ provider }: AuthTokenSyncProps) {
  if (provider === "clerk") return <ClerkTokenSync />;
  if (provider === "auth0") return <Auth0TokenSync />;
  return null;
}
