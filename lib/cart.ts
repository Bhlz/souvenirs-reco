'use client';

export type CartItem = { slug: string; qty: number; options?: Record<string,string> };
const KEY = 'souvenirs_cart_v1';

function safeParse(str: string | null): CartItem[] {
  try { return JSON.parse(str ?? '[]'); } catch { return []; }
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(KEY));
}

function countItems(items: CartItem[]) {
  return items.reduce((s, it) => s + (it.qty || 0), 0);
}

function emitAll(oldValue: string | null, newValue: string, items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    // Evento nuevo con el conteo actual
    const count = countItems(items);
    window.dispatchEvent(new CustomEvent('cart:changed', { detail: { count } }));
    // Compatibilidad con tu código previo
    window.dispatchEvent(new Event('cartchange'));
    // Simular 'storage' para listeners en la misma pestaña
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
  emitAll(oldValue, newValue, items);
}

export function addToCart(slug: string, qty = 1, options?: Record<string,string>) {
  const cart = getCart();
  const key = JSON.stringify({ slug, options: options ?? {} });
  // buscar línea “igual” (slug + mismas opciones)
  const i = cart.findIndex(x => JSON.stringify({ slug: x.slug, options: x.options ?? {} }) === key);
  if (i >= 0) cart[i].qty += qty; else cart.push({ slug, qty, options });
  setCart(cart);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart:bump'));
}

export function decrementFromCart(slug: string, qty = 1) {
  const cart = getCart();
  const i = cart.findIndex(x => x.slug === slug);
  if (i === -1) return;
  const newQty = (cart[i].qty || 0) - qty;
  if (newQty > 0) cart[i].qty = newQty;
  else cart.splice(i, 1);
  setCart(cart);
}

export const removeOneFromCart = (slug: string) => decrementFromCart(slug, 1);

export function cartTotal(amountBySlug: (slug: string) => number) {
  return getCart().reduce((sum, item) => sum + amountBySlug(item.slug) * (item.qty || 0), 0);
}

export function removeFromCart(slug: string) {
  setCart(getCart().filter(x => x.slug !== slug));
}

export function clearCart() { setCart([]); }

// Para inicializar el badge en el header
export function cartCount() {
  return countItems(getCart());
}
