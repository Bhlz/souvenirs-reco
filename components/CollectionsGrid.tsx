'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { toast } from '@/lib/toast';

type Props = { items: Product[] };

// Lee el número de WhatsApp de tus variables públicas (E.164 sin '+', por ej. 521234567890 para MX)
const WA_NUMBER =
  (process.env.NEXT_PUBLIC_WA_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    '').replace(/\D/g, '');

function buildWaLink(p: Product) {
  if (!WA_NUMBER) return null;
  const msg = `Hola, me interesa el producto "${p.name}" (${p.slug}). ¿Hay disponibilidad?`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export default function CollectionsGrid({ items }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating_desc'>('relevance');

  const categories = useMemo(() => {
    const set = new Set((items ?? []).map((p) => p.category).filter(Boolean) as string[]);
    return ['all', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    let data = [...items];
    if (q.trim()) {
      const t = q.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(t) ||
          p.category?.toLowerCase().includes(t) ||
          p.description?.toLowerCase().includes(t),
      );
    }
    if (cat !== 'all') data = data.filter((p) => p.category === cat);
    switch (sort) {
      case 'price_asc':
        data.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        data.sort((a, b) => b.price - a.price);
        break;
      case 'rating_desc':
        data.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        break;
    }
    return data;
  }, [items, q, cat, sort]);

  return (
    <div className="space-y-5">
      {/* Controles */}
      <div className="sticky top-0 z-10 -mx-4 rounded-xl bg-white/70 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="input w-full max-w-sm"
            placeholder="Buscar productos…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'Todas las categorías' : c}
              </option>
            ))}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="relevance">Relevancia</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="rating_desc">Mejor calificados</option>
          </select>

          <div className="ml-auto text-sm text-neutral-600">{filtered.length} resultados</div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p, i) => (
          <Card key={p.slug} p={p} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Tarjeta con botón "Ordenar por WhatsApp" ---------- */

function Card({ p, index }: { p: Product; index: number }) {
  const cover = (p.images ?? []).find((s) => !!s && s.trim() !== '');
  const wa = buildWaLink(p);

  return (
    <article
      className="group relative will-change-transform"
      style={{ animation: `fadeUp 0.6s ease ${index * 40}ms both` }}
    >
      {/* Glow/halo en hover */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(120px 80px at 50% 30%, rgba(236,72,153,0.25), transparent)' }}
      />

      <div className="card relative overflow-hidden rounded-2xl border bg-white/70 p-0 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg">
        {/* Imagen (clic a detalle) */}
        <Link href={`/product/${p.slug}`} className="relative block aspect-[4/3] w-full overflow-hidden">
          {cover ? (
            <Image
              src={cover}
              alt={p.name}
              fill
              sizes="(max-width:768px) 100vw, (max-width:1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
              Sin imagen
            </div>
          )}
          {/* Badges */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {p.category && (
              <span className="rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">{p.category}</span>
            )}
            {typeof p.rating === 'number' && (
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-neutral-800">★ {p.rating?.toFixed(1)}</span>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="p-4">
          <Link href={`/product/${p.slug}`} className="line-clamp-1 font-semibold hover:underline">
            {p.name}
          </Link>
          <div className="mt-1 flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              {(p.reviews ?? 0) > 0 ? `${p.reviews} reseñas` : 'Nuevo'}
            </div>
            <div className="text-right text-lg font-extrabold">
              {p.price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </div>
          </div>
        </div>

        {/* Acciones rápidas: Ordenar por WhatsApp + Ver */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
          <div className="pointer-events-auto mb-3 hidden gap-2 rounded-full bg-white/90 p-1 shadow-sm backdrop-blur transition-all duration-200 group-hover:flex">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn px-3"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Ordenar
              </a>
            ) : (
              <button
                className="btn px-3 opacity-60"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast('Configura NEXT_PUBLIC_WA_NUMBER en tu .env.local (E.164 sin "+")');
                }}
              >
                Ordenar
              </button>
            )}
            <Link href={`/product/${p.slug}`} className="btn px-3">
              Ver
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------- Animación simple de aparición (stagger) ---------- */
declare global {
  // evita duplicar los keyframes si el componente se monta varias veces
  // eslint-disable-next-line no-var
  var __collections_keyframes: boolean | undefined;
}
if (typeof window !== 'undefined' && !globalThis.__collections_keyframes) {
  const style = document.createElement('style');
  style.innerHTML = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }`;
  document.head.appendChild(style);
  globalThis.__collections_keyframes = true;
}
