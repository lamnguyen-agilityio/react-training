"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
  createCartStore,
  type CartStore,
  type CartState,
  type CartItem,
  defaultInitState,
} from "./cart-store";

export type CartStoreApi = ReturnType<typeof createCartStore>;

const CartStoreContext = createContext<CartStoreApi | undefined>(undefined);

interface CartStoreProviderProps {
  children: ReactNode;
  initialState?: CartState;
}

export const CartStoreProvider = ({
  children,
  initialState,
}: CartStoreProviderProps) => {
  const storeRef = useRef<CartStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createCartStore(initialState ?? defaultInitState);
  }

  // Hydrate from localStorage on mount
  useEffect(() => {
    storeRef.current?.persist.rehydrate();
  }, []);

  // Listen for cart:rehydrate event — triggered after login cart sync
  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ items?: CartItem[] }>).detail;

      if (detail?.items) {
        // Direct set — faster than rehydrate, no localStorage round-trip
        store.setState({ items: detail.items });
      } else {
        store.persist.rehydrate();
      }
    };

    window.addEventListener("cart:rehydrate", handler);
    return () => window.removeEventListener("cart:rehydrate", handler);
  }, []);

  return (
    <CartStoreContext.Provider value={storeRef.current}>
      {children}
    </CartStoreContext.Provider>
  );
};

export const useCartStore = <T,>(selector: (store: CartStore) => T): T => {
  const cartStoreContext = useContext(CartStoreContext);
  if (!cartStoreContext) {
    throw new Error("useCartStore must be used within CartStoreProvider");
  }
  return useStore(cartStoreContext, selector);
};

export const useCartItems    = () => useCartStore((state) => state.items);
export const useCartIsOpen   = () => useCartStore((state) => state.isOpen);
export const useTotalItems   = () =>
  useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
export const useTotalPrice   = () =>
  useCartStore((state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0));
export const useCartItem     = (productId: string) =>
  useCartStore((state) => state.items.find((item) => item.productId === productId));

export const useCartActions = () => {
  const addItem       = useCartStore((state) => state.addItem);
  const removeItem    = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart     = useCartStore((state) => state.clearCart);
  const toggleCart    = useCartStore((state) => state.toggleCart);
  const openCart      = useCartStore((state) => state.openCart);
  const closeCart     = useCartStore((state) => state.closeCart);
  return { addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart };
};
