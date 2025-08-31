'use client';
export type CartItem = { slug: string; qty: number };
const KEY = 'souvenirs_cart_v1';

function safeParse(str: string | null): CartItem[] {
  try { return JSON.parse(str ?? '[]'); } catch { return []; }
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(KEY));
}

function emitChange(oldValue: string | null, newValue: string) {
  if (typeof window === 'undefined') return;
  try {
    // Evento propio (misma pestaña)
    window.dispatchEvent(new Event('cartchange'));
    // Opcional: disparar también un StorageEvent (para quien escuche 'storage')
    const se = new StorageEvent('storage', {
      key: KEY, oldValue, newValue, storageArea: localStorage, url: location.href,
    });
    window.dispatchEvent(se);
  } catch {
    try { window.dispatchEvent(new Event('cartchange')); } catch {}
  }
}

export function setCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  const oldValue = localStorage.getItem(KEY);
  const newValue = JSON.stringify(items);
  localStorage.setItem(KEY, newValue);
  emitChange(oldValue, newValue);
}

export function addToCart(slug: string, qty = 1) {
  const cart = getCart();
  const i = cart.findIndex(x => x.slug === slug);
  if (i >= 0) cart[i].qty += qty; else cart.push({ slug, qty });
  setCart(cart);
}

export function decrementFromCart(slug: string, qty = 1) {
  const cart = getCart();
  const i = cart.findIndex(x => x.slug === slug);
  if (i === -1) return;
  const newQty = cart[i].qty - qty;
  if (newQty > 0) cart[i].qty = newQty;
  else cart.splice(i, 1);
  setCart(cart);
}

export const removeOneFromCart = (slug: string) => decrementFromCart(slug, 1);

export function cartTotal(amountBySlug: (slug: string) => number) {
  return getCart().reduce((sum, item) => sum + amountBySlug(item.slug) * item.qty, 0);
}

export function removeFromCart(slug: string) {
  setCart(getCart().filter(x => x.slug !== slug));
}

export function clearCart() { setCart([]); }
