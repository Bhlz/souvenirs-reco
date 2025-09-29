// app/order/[id]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type OrderItem = { slug: string; qty: number; price: number };
type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  raw?: any;
};

function currency(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function OrderPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Intenta API y después localStorage
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (active) setOrder(data);
        } else {
          // Fallback: snapshot guardado por el carrito
          const snap = localStorage.getItem(`order_snapshot_${id}`);
          if (snap && active) setOrder(JSON.parse(snap));
        }
      } catch {
        const snap = localStorage.getItem(`order_snapshot_${id}`);
        if (snap && active) setOrder(JSON.parse(snap));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const subtotal = useMemo(
    () => (order?.items || []).reduce((s, it) => s + it.price * it.qty, 0),
    [order]
  );

  if (loading) {
    return <div className="container py-16">Cargando pedido…</div>;
  }

  if (!order) {
    return (
      <div className="container py-16">
        <h1 className="text-2xl font-bold">Orden no encontrada</h1>
        <p className="mt-2 text-neutral-600">
          Si acabas de crearla por WhatsApp, vuelve a abrir el link desde el chat.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-2xl font-bold">Orden #{order.id.slice(0, 8)}</h1>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-xl border p-4">
          <div className="font-semibold">Productos</div>
          <div className="mt-2 divide-y">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div className="mr-3">
                  <div className="font-medium">{it.slug}</div>
                  <div className="text-neutral-600">x{it.qty}</div>
                </div>
                <div className="text-right">
                  <div>{currency(it.price)} c/u</div>
                  <div className="text-neutral-600">{currency(it.price * it.qty)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border p-4 h-max">
          <div className="font-semibold">Resumen</div>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{currency(order.total)}</span>
            </div>
          </div>

          <div className="mt-4 text-sm text-neutral-600">
            Estado: <b>{order.status}</b> (este pedido se completa por WhatsApp).
          </div>
        </aside>
      </div>
    </div>
  );
}
