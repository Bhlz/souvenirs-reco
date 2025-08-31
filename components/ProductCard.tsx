'use client';
import Image from 'next/image';
import { addToCart } from '@/lib/cart';
import { toast } from '@/lib/toast';
import type { Product } from '@/lib/types';

const currency = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const sanitizeImages = (arr?: string[]) =>
  (arr ?? []).filter((s) => !!s && s.trim() !== '');

function Stars({ value = 0 }: { value?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="text-amber-500 text-[13px] leading-none">
      {Array.from({ length: 5 }).map((_, i) =>
        i < full ? '★' : i === full && half ? '⯪' : '☆'
      ).join(' ')}
    </div>
  );
}

function useWishlist() {
  const KEY = 'souvenirs_wishlist_v1';
  const get = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') as string[]; } catch { return []; }
  };
  const has = (slug: string) => get().includes(slug);
  const toggle = (slug: string) => {
    const cur = new Set(get());
    cur.has(slug) ? cur.delete(slug) : cur.add(slug);
    localStorage.setItem(KEY, JSON.stringify([...cur]));
  };
  return { has, toggle };
}

export default function ProductCard({
  p,
  onQuickView,
}: {
  p: Product;
  onQuickView?: (p: Product) => void;
}) {
  const { has, toggle } = useWishlist();
  const wish = has(p.slug);
  const out = (p.stock ?? 0) <= 0;
  const imgs = sanitizeImages(p.images);
  const img0 = imgs[0];
  const img1 = imgs[1] ?? img0;

  return (
    <div
      className="group relative h-full rounded-2xl border bg-white/60 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur
                 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex gap-2">
        {out && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">Agotado</span>}
        {p.category && <span className="rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">{p.category}</span>}
      </div>

      {/* Imagen con swap al hover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        {img0 ? (
          <>
            <Image
              src={img0}
              alt={p.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={`object-cover transition-opacity duration-500 ${img1 ? 'opacity-100 group-hover:opacity-0' : ''}`}
            />
            {img1 && (
              <Image
                src={img1}
                alt={`${p.name} 2`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                priority={false}
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
            Sin imagen
          </div>
        )}

        {/* Acciones flotantes */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
          <div className="pointer-events-auto mb-3 hidden gap-2 rounded-full bg-white/90 p-1 shadow-sm backdrop-blur
                          transition-all duration-200 group-hover:flex">
            {onQuickView && (
              <button className="btn px-3" onClick={() => onQuickView(p)} title="Vista rápida">
                Ver
              </button>
            )}
            <button
              className={`btn px-3 ${wish ? 'ring-2 ring-pink-500' : ''}`}
              onClick={() => { toggle(p.slug); toast(wish ? 'Quitado de favoritos' : 'Añadido a favoritos'); }}
              title="Guardar"
            >
              ♥
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <div className="line-clamp-2 font-semibold">{p.name}</div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Stars value={p.rating ?? 0} />
          {p.reviews ? <span>({p.reviews})</span> : null}
        </div>
        <div className="text-lg font-extrabold">{currency(p.price)}</div>
      </div>

      {/* Botón principal */}
      <button
        disabled={out}
        onClick={() => { addToCart(p.slug, 1); toast('Agregado al carrito'); }}
        className="btn-primary mt-3 w-full disabled:opacity-60"
      >
        {out ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </div>
  );
}
