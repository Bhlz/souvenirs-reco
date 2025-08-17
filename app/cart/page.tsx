
'use client';
import { getCart, removeFromCart } from '@/lib/cart';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from '@/lib/toast';

type Prod = { slug: string; name: string; price: number; images: string[] };

export default function CartPage() {
  const [items, setItems] = useState(getCart());
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState({ name: '', email: '', rfc: '' });
  const [products, setProducts] = useState<Prod[]>([]);

  const refresh = () => setItems(getCart());

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  useEffect(() => {
    fetch('/api/public/products', { cache: 'no-store' })
      .then(r=>r.json()).then(d=> setProducts(d.products || []))
      .catch(()=> setProducts([]));
  }, []);

  const prodBySlug = useMemo(() => Object.fromEntries(products.map(p => [p.slug, p])), [products]);

  async function payMP() {
    try {
      setLoading(true);
      const res = await fetch('/api/checkout/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, billing }),
      });
      if (!res.ok) throw new Error('MP error');
      const data = await res.json();
      toast('Redirigiendo al pago…');
      window.location.href = data.init_point;
    } catch (e) {
      alert('Error al iniciar pago. Revisa tu token de Mercado Pago en .env.local');
    } finally {
      setLoading(false);
    }
  }

  const empty = items.length === 0;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">Tu carrito</h1>
      {empty ? (
        <div className="mt-6">Tu carrito está vacío. <a className="text-brand underline" href="/">Ir a la tienda</a></div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            {items.map((it)=> {
              const p = prodBySlug[it.slug] as Prod | undefined;
              return (
                <div key={it.slug} className="card flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl border">
                    {p ? <Image src={p.images?.[0] || '/logos/visa.svg'} alt={p?.name || it.slug} fill className="object-cover"/> : null}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{p?.name || it.slug}</div>
                    <div className="text-sm text-neutral-600">Cantidad: {it.qty}</div>
                    {p && <div className="text-sm">${p.price} MXN</div>}
                  </div>
                  <button className="btn" onClick={()=>{ removeFromCart(it.slug); refresh(); toast('Producto eliminado'); }}>Quitar</button>
                </div>
              );
            })}
          </div>
          <aside className="card h-max">
            <div className="text-lg font-bold">Datos de facturación (opcional)</div>
            <div className="mt-3 grid gap-2">
              <input className="input" placeholder="Nombre o Razón social" value={billing.name} onChange={e=>setBilling({...billing, name: e.target.value})} />
              <input className="input" placeholder="Email para factura" type="email" value={billing.email} onChange={e=>setBilling({...billing, email: e.target.value})} />
              <input className="input" placeholder="RFC" value={billing.rfc} onChange={e=>setBilling({...billing, rfc: e.target.value.toUpperCase()})} />
            </div>
            <button className="btn-primary mt-4 w-full disabled:opacity-60" disabled={loading} onClick={payMP}>
              {loading ? 'Redirigiendo…' : 'Pagar con Mercado Pago'}
            </button>
            <div className="mt-3 text-xs text-neutral-500">* El pago se procesa de forma segura en Mercado Pago.</div>
          </aside>
        </div>
      )}
    </div>
  );
}
