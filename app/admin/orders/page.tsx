'use client';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then(r=>r.json());

export default function AdminOrders() {
  const { data, mutate } = useSWR('/api/admin/orders', fetcher);
  const orders = data?.orders || [];
  const [loadingId, setLoadingId] = useState<string| null>(null);

  async function markShipped(id: string) {
    const tracking = prompt('Número de guía (opcional):') || undefined;
    const carrier = prompt('Paquetería (opcional):') || undefined;
    setLoadingId(id);
    await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, shipment: { status: 'shipped', tracking, carrier } })
    });
    setLoadingId(null);
    mutate();
  }

  async function setInvoice(id: string) {
    const number = prompt('Folio/No. de factura:') || undefined;
    const url = prompt('URL del PDF de factura:') || undefined;
    setLoadingId(id);
    await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, invoice: { number, url } })
    });
    setLoadingId(null);
    mutate();
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">Órdenes</h1>
      <div className="mt-6 grid gap-4">
        {orders.map((o: any) => (
          <div key={o.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Orden #{o.id.slice(0,8)}</div>
                <div className="text-sm text-neutral-600">Pref: {o.preferenceId} · Pago: {o.paymentId || '—'} · Estado: <strong>{o.status}</strong></div>
                <div className="text-sm text-neutral-600">Envío: {o.shipment?.status || 'pending'} {o.shipment?.tracking ? `· Guía: ${o.shipment.tracking}` : ''}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn" disabled={loadingId===o.id} onClick={()=>markShipped(o.id)}>
                  {loadingId===o.id ? 'Guardando...' : 'Marcar enviado'}
                </button>
                <button className="btn" disabled={loadingId===o.id} onClick={()=>setInvoice(o.id)}>
                  {loadingId===o.id ? 'Guardando...' : 'Factura'}
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="font-semibold">Artículos</div>
              {o.items.map((it:any)=> (
                <div key={it.slug}>{it.qty} × {it.slug} — ${it.price} MXN</div>
              ))}
              <div className="mt-2 font-semibold">Total: ${o.total} MXN</div>
              {o.raw?.billing && (
                <div className="mt-2 text-neutral-700">
                  <div className="font-semibold">Facturación</div>
                  <div>Nombre/Razón social: {o.raw.billing.name || '—'}</div>
                  <div>Email: {o.raw.billing.email || '—'}</div>
                  <div>RFC: {o.raw.billing.rfc || '—'}</div>
                </div>
              )}
              {o.invoice && (
                <div className="text-neutral-700">
                  <div className="font-semibold">Factura</div>
                  <div>Folio: {o.invoice.number || '—'}</div>
                  {o.invoice.url && <a className="text-brand underline" href={o.invoice.url} target="_blank">Ver PDF</a>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
