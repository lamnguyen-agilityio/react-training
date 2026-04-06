import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import {
  mergeCart,
  getUserCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
} from "@/lib/api/cart";
import type { CartItemResponse, AddCartItemResponse } from "@/lib/api/cart";
import { useAuthUserStore } from "@/lib/store/auth-user.store";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  cartItemId?: string; // undefined for guest items or before API response
  productId: string;
  name: string;
  price: number;
  quantity: number;
  slug: string;
  image?: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isMerging: boolean;
}

export interface CartActions {
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  mergeGuestCart: (accessToken: string) => Promise<void>;
}

export type CartStore = CartState & CartActions;

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/**
 * Apply server response to store.
 * - Same cartItemId + same qty → return same reference (no re-render)
 * - Different qty (e.g. stock limit) → use server value
 * - keepQuantity=true → preserve optimistic qty, only sync cartItemId
 */
function upsertItem(
  items: CartItem[],
  incoming: AddCartItemResponse,
  keepQuantity = false,
): CartItem[] {
  const productId = incoming.product.id;
  const existing = items.find((i) => i.productId === productId);

  const mapped: CartItem = {
    cartItemId: incoming.id,
    productId,
    name: incoming.product.name,
    slug: incoming.product.slug,
    price: parseFloat(String(incoming.product.price)),
    image: incoming.product.image,
    quantity: incoming.quantity,
  };

  if (existing) {
    const finalQty = keepQuantity ? existing.quantity : mapped.quantity;

    // Nothing changed — same reference, no re-render
    if (
      existing.cartItemId === mapped.cartItemId &&
      existing.quantity === finalQty
    ) {
      return items;
    }

    return items.map((i) =>
      i.productId === productId ? { ...mapped, quantity: finalQty } : i,
    );
  }

  return [...items, mapped];
}

// ── In-flight version tracker ─────────────────────────────────────────────────
// Only the LAST API response updates the store — stale responses are ignored.

const inflightVersion = new Map<string, number>();

function nextVersion(productId: string): number {
  const v = (inflightVersion.get(productId) ?? 0) + 1;
  inflightVersion.set(productId, v);
  return v;
}

function isLatest(productId: string, version: number): boolean {
  return inflightVersion.get(productId) === version;
}

// ── Default state ─────────────────────────────────────────────────────────────

export const defaultInitState: CartState = {
  items: [],
  isOpen: false,
  isMerging: false,
};

// ── Store factory ─────────────────────────────────────────────────────────────

export const createCartStore = (initState: CartState = defaultInitState) => {
  return createStore<CartStore>()(
    persist(
      (set, get) => ({
        ...initState,

        // ── addItem ──────────────────────────────────────────────────────────
        addItem: (item, quantity = 1) => {
          const accessToken = useAuthUserStore.getState().accessToken;

          // 1. Optimistic update immediately
          set((state) => {
            const existing = state.items.find(
              (i) => i.productId === item.productId,
            );
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.productId === item.productId
                    ? { ...i, quantity: i.quantity + quantity }
                    : i,
                ),
              };
            }
            return { items: [...state.items, { ...item, quantity }] };
          });

          if (!accessToken) return;

          const version = nextVersion(item.productId);
          const optimisticQty =
            get().items.find((i) => i.productId === item.productId)?.quantity ??
            quantity;
          const snapshot = get().items;

          // 2. Fire API immediately, ignore stale responses
          addCartItem(
            { productId: item.productId, quantity: optimisticQty },
            accessToken,
          )
            .then((response) => {
              if (!isLatest(item.productId, version)) return;
              set((state) => ({
                items: upsertItem(state.items, response, true),
              }));
            })
            .catch(() => {
              if (!isLatest(item.productId, version)) return;
              set({ items: snapshot });
            });
        },

        // ── removeItem ───────────────────────────────────────────────────────
        removeItem: (productId) => {
          const snapshot = get().items;
          const cartItemId = snapshot.find(
            (i) => i.productId === productId,
          )?.cartItemId;

          // Optimistic remove immediately
          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          }));

          const accessToken = useAuthUserStore.getState().accessToken;
          if (!accessToken) return;

          if (cartItemId) {
            // cartItemId known — delete directly
            deleteCartItem(cartItemId, accessToken).catch(() => {
              set({ items: snapshot });
            });
          } else {
            // cartItemId unknown (guest item) — fetch cart to get it first
            getUserCart(accessToken)
              .then((cart) => {
                const serverItem = cart.items.find(
                  (i) => i.product.id === productId,
                );
                if (!serverItem?.id) return;
                return deleteCartItem(serverItem.id, accessToken);
              })
              .catch(() => {
                set({ items: snapshot });
              });
          }
        },

        // ── updateQuantity ───────────────────────────────────────────────────
        updateQuantity: (productId, quantity) => {
          const snapshot = get().items;
          const currentItem = snapshot.find((i) => i.productId === productId);
          const accessToken = useAuthUserStore.getState().accessToken;

          if (quantity <= 0) {
            set((state) => ({
              items: state.items.filter((i) => i.productId !== productId),
            }));
            if (accessToken && currentItem?.cartItemId) {
              deleteCartItem(currentItem.cartItemId, accessToken).catch(() => {
                set({ items: snapshot });
              });
            }
            return;
          }

          // 1. Optimistic update immediately
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i,
            ),
          }));

          if (!accessToken) return;

          const version = nextVersion(productId);
          const cartItemId = currentItem?.cartItemId;

          // 2. Fire API immediately, ignore stale responses
          const sync = async () => {
            const response = cartItemId
              ? await updateCartItem(cartItemId, quantity, accessToken)
              : await addCartItem({ productId, quantity }, accessToken);

            if (!isLatest(productId, version)) return;
            set((state) => ({
              items: upsertItem(state.items, response, true),
            }));
          };

          sync().catch(() => {
            if (!isLatest(productId, version)) return;
            set({ items: snapshot });
          });
        },

        clearCart: () => set({ items: [] }),
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),

        mergeGuestCart: async (accessToken) => {
          const { items } = get();
          set({ isMerging: true });
          try {
            const response =
              items.length > 0
                ? await mergeCart(
                    {
                      items: items.map((i) => ({
                        productId: i.productId,
                        quantity: i.quantity,
                      })),
                    },
                    accessToken,
                  )
                : await getUserCart(accessToken);

            set({ items: response.items.map(toCartItem), isMerging: false });
          } catch (err) {
            console.error("[CartStore] mergeGuestCart failed:", err);
            set({ isMerging: false });
          }
        },
      }),
      {
        name: "cart-storage",
        skipHydration: true,
        partialize: (state) => ({ items: state.items }),
      },
    ),
  );
};
