'use client';

import {
  getCart,
  addToCart,
  decrementFromCart,
  removeFromCart,
  clearCart,
} from '@/lib/cart';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from '@/lib/toast';

type Prod = { slug: string; name: string; price: number; images: string[] };
type CartItem = { slug: string; qty: number };

// ---------- Ajustes de negocio (fáciles de cambiar) ----------
const FREE_SHIP_THRESHOLD = 999; // MXN para envío gratis
const IVA_RATE = 0.16;           // IVA (solo para desglose visual)
const SHIPPING_OPTIONS = [
  { id: 'pickup',   label: 'Recoger en tienda',        cost: 0,  eta: 'Hoy mismo' },
  { id: 'standard', label: 'Envío estándar (2–5 días)', cost: 99, eta: '2–5 días' },
  { id: 'express',  label: 'Envío express (1–2 días)',  cost: 169, eta: '1–2 días' },
] as const;

// Códigos demo de cupón (puedes validarlos en backend luego)
const COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number }> = {
  NOWYA10: { type: 'percent', value: 10 }, // 10% off
  HOLA50:  { type: 'fixed', value: 50 },   // -$50 MXN
};

// ---------- Guardados para después (localStorage simple) ----------
const SAVED_KEY = 'souvenirs_saved_v1';
function getSaved(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
}
function setSaved(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAVED_KEY, JSON.stringify(items));
  try { window.dispatchEvent(new Event('cartchange')); } catch {}
}
function moveToSaved(slug: string) {
  const cart = getCart();
  const idx = cart.findIndex(x => x.slug === slug);
  if (idx === -1) return;
  const item = cart[idx];
  // quitar del carrito
  cart.splice(idx, 1);
  // añadir a guardados (merge qty si existe)
  const saved = getSaved();
  const j = saved.findIndex(x => x.slug === slug);
  if (j >= 0) saved[j].qty += item.qty; else saved.push(item);
  setSaved(saved);
  // reflejar en carrito
  localStorage.setItem('souvenirs_cart_v1', JSON.stringify(cart));
  try { window.dispatchEvent(new Event('cartchange')); } catch {}
  toast('Guardado para después');
}
function moveToCartFromSaved(slug: string) {
  const saved = getSaved();
  const j = saved.findIndex(x => x.slug === slug);
  if (j === -1) return;
  const item = saved[j];
  // quitar de guardados
  saved.splice(j, 1);
  setSaved(saved);
  // agregar al carrito
  addToCart(slug, item.qty);
  toast('Movido al carrito');
}

// ---------- Componente ----------
export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(getCart());
  const [saved, setSavedState] = useState<CartItem[]>(getSaved());
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState({ name: '', email: '', rfc: '' });
  const [products, setProducts] = useState<Prod[]>([]);
  const [shippingId, setShippingId] = useState<typeof SHIPPING_OPTIONS[number]['id']>('standard');
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const refresh = () => {
    setItems(getCart());
    setSavedState(getSaved());
  };

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('storage', h);
    window.addEventListener('cartchange', h);
    return () => {
      window.removeEventListener('storage', h);
      window.removeEventListener('cartchange', h);
    };
  }, []);

  useEffect(() => {
    fetch('/api/public/products', { cache: 'no-store' })
      .then(r => r.json()).then(d => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  const prodBySlug = useMemo(
    () => Object.fromEntries(products.map(p => [p.slug, p])),
    [products]
  );

  const currency = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  // Subtotal
  const subtotal = useMemo(
    () => items.reduce((acc, it) => {
      const p = prodBySlug[it.slug] as Prod | undefined;
      return acc + (p?.price || 0) * it.qty;
    }, 0),
    [items, prodBySlug]
  );

  // Envío
  const selectedShipping = SHIPPING_OPTIONS.find(s => s.id === shippingId)!;
  const shippingCost = subtotal >= FREE_SHIP_THRESHOLD ? 0 : selectedShipping.cost;

  // Cupón
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const rule = COUPONS[appliedCoupon.toUpperCase()];
    if (!rule) return 0;
    if (rule.type === 'percent') return Math.round((subtotal * rule.value) * 0.01);
    return Math.min(subtotal, rule.value); // fijo
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal - discount) + shippingCost;

  const empty = items.length === 0;

  // Upsell: productos que no están en el carrito (primeros 4)
  const upsell = useMemo(() => {
    const inCart = new Set(items.map(i => i.slug));
    return products.filter(p => !inCart.has(p.slug)).slice(0, 4);
  }, [products, items]);

  function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    if (!COUPONS[code]) {
      toast('Cupón no válido');
      return;
    }
    setAppliedCoupon(code);
    toast('Cupón aplicado');
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCoupon('');
    toast('Cupón eliminado');
  }

  function inc(slug: string) {
    addToCart(slug, 1);
    refresh();
  }

  function dec(slug: string) {
    decrementFromCart(slug);
    refresh();
  }

  function removeLine(slug: string) {
    removeFromCart(slug);
    refresh();
    toast('Producto eliminado');
  }

  async function payMP() {
    try {
      setLoading(true);
      const res = await fetch('/api/checkout/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          billing,
          // Enviar resumen por si quieres calcular shipping/discount server-side
          pricing: { subtotal, discount, shipping: shippingCost, total, coupon: appliedCoupon },
        }),
      });
      if (!res.ok) throw new Error('MP error');
      const data = await res.json();
      toast('Redirigiendo al pago…');
      window.location.href = data.init_point;
    } catch {
      alert('Error al iniciar pago. Revisa tu token de Mercado Pago en .env.local');
    } finally {
      setLoading(false);
    }
  }

  // Barra para envío gratis
  const freeShipProgress = Math.min(subtotal / FREE_SHIP_THRESHOLD, 1);
  const missingForFree = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Tu carrito</h1>
        {!empty && (
          <div className="flex items-center gap-3">
            <a className="text-brand underline" href="/">Seguir comprando</a>
            <button
              className="btn"
              onClick={() => { clearCart(); refresh(); toast('Carrito vaciado'); }}
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>

      {empty ? (
        <div className="mt-6">
          Tu carrito está vacío.{' '}
          <a className="text-brand underline" href="/">Ir a la tienda</a>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* --------- Lista de ítems --------- */}
          <div className="space-y-4">
            {/* Free shipping banner */}
            <div className="card">
              {subtotal >= FREE_SHIP_THRESHOLD ? (
                <div className="text-sm">
                  ¡Tienes <span className="font-semibold">envío gratis</span>! 🎉
                </div>
              ) : (
                <>
                  <div className="text-sm">
                    Te faltan <span className="font-semibold">{currency(missingForFree)}</span> para envío gratis.
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${freeShipProgress * 100}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            {items.map((it) => {
              const p = prodBySlug[it.slug] as Prod | undefined;
              const lineTotal = (p?.price || 0) * it.qty;

              return (
                <div key={it.slug} className="card flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border">
                    {p ? (
                      <Image
                        src={p.images?.[0] || '/logos/visa.svg'}
                        alt={p?.name || it.slug}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{p?.name || it.slug}</div>
                    {p && (
                      <div className="mt-0.5 text-xs text-neutral-600">
                        {currency(p.price)} c/u
                      </div>
                    )}

                    {/* Controles de cantidad */}
                    <div className="mt-3 flex w-full items-center gap-2">
                      <button
                        className="btn"
                        onClick={() => dec(it.slug)}
                        aria-label="Disminuir"
                        title="Disminuir"
                      >
                        −
                      </button>
                      <input
                        className="input w-16 text-center"
                        value={it.qty}
                        inputMode="numeric"
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(999, Number(e.target.value) || 0));
                          if (v === 0) removeLine(it.slug);
                          else {
                            // ajustar a la cantidad exacta
                            const current = it.qty;
                            if (v > current) addToCart(it.slug, v - current);
                            if (v < current) for (let k = 0; k < current - v; k++) decrementFromCart(it.slug);
                            refresh();
                          }
                        }}
                      />
                      <button
                        className="btn"
                        onClick={() => inc(it.slug)}
                        aria-label="Aumentar"
                        title="Aumentar"
                      >
                        +
                      </button>

                      <div className="ml-auto flex items-center gap-3">
                        <button className="text-sm underline" onClick={() => { moveToSaved(it.slug); refresh(); }}>
                          Guardar para después
                        </button>
                        <button className="text-sm text-red-600 underline" onClick={() => removeLine(it.slug)}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Total de línea */}
                  <div className="text-right sm:w-40">
                    <div className="text-sm text-neutral-600">Total línea</div>
                    <div className="text-lg font-semibold">{currency(lineTotal)}</div>
                  </div>
                </div>
              );
            })}

            {/* Guardados para después */}
            {saved.length > 0 && (
              <div className="card">
                <div className="mb-3 text-lg font-semibold">Guardados para después</div>
                <div className="space-y-3">
                  {saved.map(s => {
                    const p = prodBySlug[s.slug] as Prod | undefined;
                    return (
                      <div key={s.slug} className="flex items-center gap-3">
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg border">
                          {p ? (
                            <Image
                              src={p.images?.[0] || '/logos/visa.svg'}
                              alt={p?.name || s.slug}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{p?.name || s.slug}</div>
                          {p && <div className="text-xs text-neutral-600">{currency(p.price)} c/u</div>}
                        </div>
                        <button className="btn" onClick={() => moveToCartFromSaved(s.slug)}>
                          Mover al carrito
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upsell */}
            {upsell.length > 0 && (
              <div className="card">
                <div className="mb-3 text-lg font-semibold">Te puede interesar</div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {upsell.map(u => (
                    <div key={u.slug} className="rounded-xl border p-3">
                      <div className="relative mb-2 h-28 w-full overflow-hidden rounded-lg">
                        <Image
                          src={u.images?.[0] || '/logos/visa.svg'}
                          alt={u.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="line-clamp-2 text-sm font-medium">{u.name}</div>
                      <div className="mt-1 text-sm text-neutral-700">{currency(u.price)}</div>
                      <button className="btn-primary mt-3 w-full" onClick={() => { addToCart(u.slug, 1); refresh(); toast('Agregado'); }}>
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --------- Aside / Resumen --------- */}
          <aside className="card h-max sticky top-4">
            <div className="text-lg font-bold">Resumen</div>

            {/* Cupón */}
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <input
                className="input"
                placeholder="Código de cupón"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              {appliedCoupon ? (
                <button className="btn" onClick={removeCoupon}>Quitar</button>
              ) : (
                <button className="btn" onClick={applyCoupon}>Aplicar</button>
              )}
            </div>
            {appliedCoupon && (
              <div className="mt-1 text-xs text-emerald-600">
                Cupón {appliedCoupon} aplicado
              </div>
            )}

            {/* Envío */}
            <div className="mt-4">
              <div className="mb-2 text-sm font-medium">Método de envío</div>
              <div className="space-y-2">
                {SHIPPING_OPTIONS.map(opt => (
                  <label key={opt.id} className="flex items-center justify-between rounded-lg border p-2">
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingId === opt.id}
                        onChange={() => setShippingId(opt.id)}
                      />
                      {opt.label} <span className="text-xs text-neutral-600">({opt.eta})</span>
                    </span>
                    <span className="text-sm font-medium">
                      {subtotal >= FREE_SHIP_THRESHOLD && opt.id !== 'pickup' ? (
                        <span className="text-emerald-600">Gratis</span>
                      ) : currency(opt.cost)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento</span>
                  <span>−{currency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Envío</span>
                <span>{currency(shippingCost)}</span>
              </div>

              {/* Desglose de IVA (visual) */}
              <button
                className="mt-1 text-xs underline"
                onClick={() => setShowTaxBreakdown(v => !v)}
              >
                {showTaxBreakdown ? 'Ocultar' : 'Mostrar'} desglose de impuestos
              </button>
              {showTaxBreakdown && (
                <div className="rounded-lg bg-neutral-50 p-2">
                  <div className="flex justify-between">
                    <span>IVA (incluido)</span>
                    <span>{currency(total - total / (1 + IVA_RATE))}</span>
                  </div>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>{currency(total)}</span>
              </div>
              <div className="text-xs text-neutral-500">Impuestos incluidos donde aplique.</div>
            </div>

            {/* Datos de facturación */}
            <div className="mt-6 text-lg font-bold">Datos de facturación (opcional)</div>
            <div className="mt-3 grid gap-2">
              <input
                className="input"
                placeholder="Nombre o Razón social"
                value={billing.name}
                onChange={e => setBilling({ ...billing, name: e.target.value })}
              />
              <input
                className="input"
                placeholder="Email para factura"
                type="email"
                value={billing.email}
                onChange={e => setBilling({ ...billing, email: e.target.value })}
              />
              <input
                className="input"
                placeholder="RFC"
                value={billing.rfc}
                onChange={e => setBilling({ ...billing, rfc: e.target.value.toUpperCase() })}
              />
            </div>

            <button
              className="btn-primary mt-4 w-full disabled:opacity-60"
              disabled={loading}
              onClick={payMP}
            >
              {loading ? 'Redirigiendo…' : 'Pagar con Mercado Pago'}
            </button>

            <div className="mt-3 grid gap-1 text-xs text-neutral-500">
              <div>Pago seguro procesado por Mercado Pago.</div>
              <div>¿Dudas? <a href="/ayuda" className="underline">Centro de ayuda</a> · <a href="/devoluciones" className="underline">Devoluciones</a></div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
