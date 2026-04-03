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
  cartItemId?: string; // server-side cart item id — needed for PATCH /carts/items/:id
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
  addItem: (
    item: Omit<CartItem, "quantity">,
    quantity?: number,
  ) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
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

function upsertItem(
  items: CartItem[],
  incoming: AddCartItemResponse,
): CartItem[] {
  const productId = incoming.product.id;
  const mapped: CartItem = {
    cartItemId: incoming.id,
    productId,
    name: incoming.product.name,
    slug: incoming.product.slug,
    price: parseFloat(String(incoming.product.price)),
    image: incoming.product.image,
    quantity: incoming.quantity,
  };
  const exists = items.some((i) => i.productId === productId);
  if (exists) {
    return items.map((i) => (i.productId === productId ? mapped : i));
  }
  return [...items, mapped];
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

        addItem: async (item, quantity = 1) => {
          const accessToken = useAuthUserStore.getState().accessToken;

          if (accessToken) {
            try {
              const response = await addCartItem(
                { productId: item.productId, quantity },
                accessToken,
              );
              set((state) => ({ items: upsertItem(state.items, response) }));
            } catch (err) {
              console.error("[CartStore] addItem API failed:", err);
              // Optimistic fallback — still add locally so UX doesn't break
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
            }
          } else {
            // ── Guest: update store only ───────────────────────────────────
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
          }
        },

        removeItem: async (productId) => {
          // Optimistic remove
          const previousItems = get().items;
          const cartItemId = previousItems.find(
            (i) => i.productId === productId,
          )?.cartItemId;

          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          }));

          const accessToken = useAuthUserStore.getState().accessToken;

          if (accessToken && cartItemId) {
            try {
              await deleteCartItem(cartItemId, accessToken);
            } catch (err) {
              console.error("[CartStore] removeItem API failed:", err);
              // Rollback
              set({ items: previousItems });
            }
          }
        },

        updateQuantity: async (productId, quantity) => {
          if (quantity <= 0) {
            set((state) => ({
              items: state.items.filter((i) => i.productId !== productId),
            }));
            return;
          }

          const previousItems = get().items;

          const accessToken = useAuthUserStore.getState().accessToken;
          if (!accessToken) {
            set((state) => ({
              items: state.items.map((i) =>
                i.productId === productId ? { ...i, quantity } : i,
              ),
            }));
            return;
          }

          try {
            let cartItemId = previousItems.find(
              (i) => i.productId === productId,
            )?.cartItemId;

            if (!cartItemId) {
              const cart = await getUserCart(accessToken);
              const serverItem = cart.items.find(
                (i) => i.product.id === productId,
              );
              cartItemId = serverItem?.id;

              if (cart.items.length > 0) {
                set({ items: cart.items.map(toCartItem) });
              }
            }

            if (!cartItemId) {
              const response = await addCartItem(
                { productId, quantity },
                accessToken,
              );
              set((state) => ({ items: upsertItem(state.items, response) }));
              return;
            }

            const response = await updateCartItem(
              cartItemId,
              quantity,
              accessToken,
            );
            set((state) => ({ items: upsertItem(state.items, response) }));
          } catch (err) {
            console.error("[CartStore] updateQuantity API failed:", err);
            set({ items: previousItems });
          }
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
