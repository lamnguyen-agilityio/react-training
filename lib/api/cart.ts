/**
 * lib/api/cart.ts
 */

import { authFetch } from "./client";
import { Category } from "./types";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  image: string;
  quantityInStock: number;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemResponse {
  id: string;
  quantity: number;
  product: CartProduct;
  createdAt: string;
  updatedAt: string;
}

export interface MergeCartResponse {
  items: CartItemResponse[];
  totalItems: number;
  totalAmount: number;
}

export interface MergeCartPayload {
  items: { productId: string; quantity: number }[];
}

export interface AddCartItemPayload {
  productId: string;
  quantity: number;
}

export type AddCartItemResponse = CartItemResponse;

/** POST /carts/items — add item to server cart, requires accessToken */
export async function addCartItem(
  payload: AddCartItemPayload,
  accessToken: string,
): Promise<AddCartItemResponse> {
  return authFetch<AddCartItemResponse>("/carts/items", accessToken, {
    method: "POST",
    body: payload,
  });
}

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

/** POST /orders — create order from current cart, requires accessToken */
export async function createOrder(accessToken: string): Promise<OrderResponse> {
  return authFetch<OrderResponse>("/orders", accessToken, {
    method: "POST",
  });
}

export async function deleteCartItem(
  cartItemId: string,
  accessToken: string,
): Promise<void> {
  return authFetch<void>(`/carts/items/${cartItemId}`, accessToken, {
    method: "DELETE",
  });
}

export async function getUserCart(
  accessToken: string,
): Promise<MergeCartResponse> {
  return authFetch<MergeCartResponse>("/carts", accessToken);
}

/** POST /carts/merge — requires accessToken */
export async function mergeCart(
  payload: MergeCartPayload,
  accessToken: string,
): Promise<MergeCartResponse> {
  return authFetch<MergeCartResponse>("/carts/merge", accessToken, {
    method: "POST",
    body: payload,
  });
}

/** PATCH /carts/items/:id — update quantity, requires accessToken */
export async function updateCartItem(
  itemId: string,
  quantity: number,
  accessToken: string,
): Promise<AddCartItemResponse> {
  return authFetch<AddCartItemResponse>(`/carts/items/${itemId}`, accessToken, {
    method: "PATCH",
    body: { quantity },
  });
}
