"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthUserStore } from "@/lib/store/auth-user.store";
import { mergeCart, getUserCart } from "@/lib/api/cart";
import type { CartItemResponse } from "@/lib/api/cart";
import type { CartItem } from "@/lib/store/cart-store";

// ── Hash parser ───────────────────────────────────────────────────────────────

interface CallbackSuccess {
  type: "success";
  accessToken: string;
  expiresIn: number;
}

interface CallbackError {
  type: "error";
  error: string;
  errorDescription: string;
}

function parseHash(hash: string): CallbackSuccess | CallbackError | null {
  if (!hash || hash === "#") return null;

  const params = new URLSearchParams(hash.replace(/^#/, ""));

  if (params.get("error")) {
    return {
      type: "error",
      error: params.get("error")!,
      errorDescription: decodeURIComponent(
        params.get("error_description") ?? "Unknown error",
      ),
    };
  }

  const accessToken = params.get("access_token");
  if (accessToken) {
    return {
      type: "success",
      accessToken,
      expiresIn: Number(params.get("expires_in") ?? 7200),
    };
  }

  return null;
}

function toCartItem(item: CartItemResponse): CartItem {
  return {
    productId: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    price: parseFloat(String(item.product.price)),
    image: item.product.image,
    quantity: item.quantity,
  };
}

async function syncCartAfterLogin(accessToken: string): Promise<void> {
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
          {
            items: guestItems.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
          accessToken,
        )
      : await getUserCart(accessToken);

  const mergedItems = response.items.map(toCartItem);
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ state: { items: mergedItems }, version: 0 }),
    );
  } catch {}
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CallbackPage() {
  const router = useRouter();
  const { setTokenAndFetchUser, status, error } = useAuthUserStore();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const result = parseHash(window.location.hash);

    if (!result) {
      router.replace("/");
      return;
    }

    if (result.type === "error") {
      const msg = encodeURIComponent(result.errorDescription);
      router.replace(`/?auth_error=${msg}`);
      return;
    }

    const { accessToken } = result;

    setTokenAndFetchUser(accessToken)
      .then(() => syncCartAfterLogin(accessToken))
      .then(() => router.replace("/"))
      .catch(() => router.replace("/"));
  }, [setTokenAndFetchUser, router]);

  // ── Error UI ──────────────────────────────────────────────────────────────

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900">
        <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900 dark:bg-zinc-950">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Sign in failed
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {error}
          </p>
          <button
            onClick={() => router.replace("/")}
            className="mt-4 text-xs text-zinc-400 underline-offset-2 hover:underline dark:text-zinc-500"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  // ── Loading UI ────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" />
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Signing you in…
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Syncing your cart
        </p>
      </div>
    </div>
  );
}
