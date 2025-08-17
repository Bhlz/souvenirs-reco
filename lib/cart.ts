'use client';
export type CartItem = { slug: string; qty: number };
const KEY = 'souvenirs_cart_v1';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function setCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}
export function addToCart(slug: string, qty = 1) {
  const cart = getCart();
  const i = cart.findIndex(x => x.slug === slug);
  if (i >= 0) cart[i].qty += qty; else cart.push({ slug, qty });
  setCart(cart);
}
export function cartTotal(amountBySlug: (slug: string) => number) {
  return getCart().reduce((sum, item) => sum + amountBySlug(item.slug) * item.qty, 0);
}
export function removeFromCart(slug: string) {
  setCart(getCart().filter(x => x.slug !== slug));
}
export function clearCart() { setCart([]); }
