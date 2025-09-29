// app/order/[id]/page.tsx
import { getOrders } from '@/lib/store';

function currency(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const all = await getOrders();
  const order = all.find((o) => o.id === id);

  if (!order) {
    return <div className="container py-16">Orden no encontrada.</div>;
  }

  return (
    <div className="container py-16">
      <h1 className="text-2xl font-bold">Orden #{order.id.slice(0, 8)}</h1>
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border p-4">
          <div className="font-semibold">Resumen</div>
          <div className="mt-2 divide-y">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span>{it.slug}</span>
                <span>
                  x{it.qty} · {currency(it.price)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 font-bold">
            <span>Total</span>
            <span>{currency(order.total)}</span>
          </div>
        </div>

        <div className="text-sm text-neutral-600">
          Estado: <b>{order.status}</b> (este pedido se completa por WhatsApp).
        </div>
      </div>
    </div>
  );
}
