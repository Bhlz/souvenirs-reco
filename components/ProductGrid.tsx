'use client';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { addToCart } from '@/lib/cart';
import type { Product } from '@/lib/types';

const SKELETONS = Array.from({ length: 8 });

export default function ProductGrid({ products }: { products: Product[] }) {
  const [list, setList] = useState<Product[]>(products);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [sort, setSort] = useState<'relevance'|'price_asc'|'price_desc'|'rating_desc'>('relevance');
  const [quick, setQuick] = useState<Product | null>(null);

  useEffect(() => { setList(products); }, [products]);

  const categories = useMemo(() => {
    const set = new Set(list.map(p => p.category).filter(Boolean) as string[]);
    return ['all', ...Array.from(set)];
  }, [list]);

  const filtered = useMemo(() => {
    let data = [...list];
    if (q.trim()) {
      const t = q.toLowerCase();
      data = data.filter(p =>
        p.name.toLowerCase().includes(t) ||
        p.category?.toLowerCase().includes(t) ||
        p.description?.toLowerCase().includes(t)
      );
    }
    if (cat !== 'all') data = data.filter(p => p.category === cat);
    switch (sort) {
      case 'price_asc': data.sort((a,b)=>a.price-b.price); break;
      case 'price_desc': data.sort((a,b)=>b.price-a.price); break;
      case 'rating_desc': data.sort((a,b)=>(b.rating??0)-(a.rating??0)); break;
      default: break;
    }
    return data;
  }, [list, q, cat, sort]);

  return (
    <section className="space-y-4">
      {/* Filtros */}
      <div className="sticky top-0 z-20 -mx-4 bg-white/70 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="input w-full max-w-sm"
            placeholder="Buscar productos…"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
          <select className="input" value={cat} onChange={e=>setCat(e.target.value)}>
            {categories.map(c=> <option key={c} value={c}>{c==='all'?'Todas las categorías':c}</option>)}
          </select>
          <select className="input" value={sort} onChange={e=>setSort(e.target.value as any)}>
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
        {loading
          ? SKELETONS.map((_,i)=>(
              <div key={i} className="animate-pulse rounded-2xl border p-3">
                <div className="aspect-[4/3] w-full rounded-xl bg-neutral-200" />
                <div className="mt-3 h-4 w-3/4 rounded bg-neutral-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200" />
                <div className="mt-3 h-9 w-full rounded bg-neutral-200" />
              </div>
            ))
          : filtered.map(p => (
              <ProductCard key={p.slug} p={p} onQuickView={setQuick} />
            ))
        }
      </div>

      {/* Modal Quick View */}
      {quick && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4"
          onClick={()=>setQuick(null)}
        >
          <div
            className="card w-full max-w-3xl overflow-hidden"
            onClick={e=>e.stopPropagation()}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                {(() => {
                  const cover = (quick.images ?? []).find((s) => !!s && s.trim() !== '');
                  return cover ? (
                    <img
                      src={cover}
                      alt={quick.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                      Sin imagen
                    </div>
                  );
                })()}
              </div>
              <div className="p-2 md:p-4">
                <h3 className="text-xl font-bold">{quick.name}</h3>
                {quick.category && <div className="mt-1 text-sm text-neutral-600">{quick.category}</div>}
                <div className="mt-3 text-2xl font-extrabold">
                  {quick.price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
                {quick.description && <p className="mt-3 text-sm text-neutral-700">{quick.description}</p>}
                <div className="mt-4 flex items-center gap-2">
                  <button className="btn-primary flex-1" onClick={()=>{ addToCart(quick.slug,1); setQuick(null); }}>
                    Agregar al carrito
                  </button>
                  <button className="btn" onClick={()=>setQuick(null)}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
