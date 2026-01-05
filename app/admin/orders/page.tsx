'use client';
import useSWR from 'swr';
import { useMemo, useState, useEffect } from 'react';
import { CheckCircle, Clock, Package, RefreshCcw, Truck } from 'lucide-react';
import type { Order } from '@/lib/store';
import { toast } from '@/lib/toast';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = 'Error al cargar órdenes';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg || 'Error al cargar órdenes');
  }
  return res.json();
};

type ShipmentStatus = Order['shipmentInfo'] extends { status: infer S } ? S : 'pending';

const statusOptions: Order['status'][] = ['pending', 'approved', 'in_process', 'rejected', 'unknown'];
const shipmentOptions: ShipmentStatus[] = ['pending', 'shipped', 'delivered'];

const currency = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export default function AdminOrders() {
  const { data, mutate, error, isLoading, isValidating } = useSWR('/api/admin/orders', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });
  const orders: Order[] = data?.orders || [];
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateOrder = async (id: string, patch: Partial<Order>) => {
    setLoadingId(id);
    const res = await fetch('/api/admin/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    setLoadingId(null);
    if (!res.ok) {
      toast('No se pudo guardar los cambios');
      return false;
    }
    toast('Cambios guardados');
    mutate();
    return true;
  };

  if (error) return <div className="container py-10 text-red-600">{error.message}</div>;
  if (isLoading) return <div className="container py-10">Cargando órdenes…</div>;

  return (
    <div className="container space-y-6 pb-10 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operación</p>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
          <p className="text-sm text-slate-500">
            Seguimiento en vivo, actualiza estados, envío y facturas sin prompts.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          <RefreshCcw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
          {isValidating ? 'Sincronizando…' : 'Actualizado'}
        </div>
      </div>

      <div className="grid gap-4">
        {orders.length === 0 && <div className="text-sm text-slate-500">No hay órdenes registradas.</div>}
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            loading={loadingId === o.id}
            onSave={(patch) => updateOrder(o.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onSave,
  loading,
}: {
  order: Order;
  loading: boolean;
  onSave: (patch: Partial<Order>) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<Order['status']>(order.status);
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>(order.shipmentInfo?.status || 'pending');
  const [tracking, setTracking] = useState(order.shipmentInfo?.tracking || '');
  const [carrier, setCarrier] = useState(order.shipmentInfo?.carrier || '');
  const [invoiceNumber, setInvoiceNumber] = useState(order.invoice?.number || '');
  const [invoiceUrl, setInvoiceUrl] = useState(order.invoice?.url || '');

  useEffect(() => {
    setStatus(order.status);
    setShipmentStatus((order.shipmentInfo?.status as ShipmentStatus) || 'pending');
    setTracking(order.shipmentInfo?.tracking || '');
    setCarrier(order.shipmentInfo?.carrier || '');
    setInvoiceNumber(order.invoice?.number || '');
    setInvoiceUrl(order.invoice?.url || '');
  }, [order.id, order.status, order.shipmentInfo?.status, order.shipmentInfo?.tracking, order.shipmentInfo?.carrier, order.invoice?.number, order.invoice?.url]);

  const total = useMemo(() => currency(order.total ?? 0), [order.total]);

  const saveShipping = () =>
    onSave({
      status,
      shipmentInfo: { status: shipmentStatus, tracking: tracking || undefined, carrier: carrier || undefined },
    });

  const saveInvoice = () => onSave({ invoice: { number: invoiceNumber || undefined, url: invoiceUrl || undefined } });

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Orden #{order.id.slice(0, 8)}</div>
          <div className="text-xs text-slate-500">
            Pref: {order.preferenceId} · Pago: {order.paymentId || '—'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect value={status} onChange={setStatus} disabled={loading} />
          <button className="btn" onClick={saveShipping} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar estado'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-100 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Package className="h-4 w-4" /> Artículos
          </div>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            {order.items.map((it) => (
              <div key={it.slug}>{it.qty} × {it.slug} — {currency(it.price)}</div>
            ))}
            <div className="pt-2 text-sm font-semibold text-emerald-700">Total: {total}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 p-3">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> Envío</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {shipmentStatus}
            </span>
          </div>
          <div className="mt-2 space-y-2 text-sm">
            <label className="text-xs font-semibold text-slate-600">Estatus</label>
            <select
              className="input"
              value={shipmentStatus}
              onChange={(e) => setShipmentStatus(e.target.value as any)}
              disabled={loading}
            >
              {shipmentOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <label className="text-xs font-semibold text-slate-600">Paquetería</label>
            <input
              className="input"
              placeholder="DHL, FedEx..."
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              disabled={loading}
            />
            <label className="text-xs font-semibold text-slate-600">Guía</label>
            <input
              className="input"
              placeholder="0000-0000-0000"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              disabled={loading}
            />
            <button className="btn mt-2 w-full" onClick={saveShipping} disabled={loading}>
              {loading ? 'Guardando...' : 'Actualizar envío'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CheckCircle className="h-4 w-4" /> Facturación
          </div>
          <div className="mt-2 space-y-2 text-sm">
            <label className="text-xs font-semibold text-slate-600">Folio</label>
            <input
              className="input"
              placeholder="FAC-0001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              disabled={loading}
            />
            <label className="text-xs font-semibold text-slate-600">URL PDF</label>
            <input
              className="input"
              placeholder="https://..."
              value={invoiceUrl}
              onChange={(e) => setInvoiceUrl(e.target.value)}
              disabled={loading}
            />
            <button className="btn mt-2 w-full" onClick={saveInvoice} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar factura'}
            </button>
            {order.invoice?.url && (
              <a className="text-xs text-brand underline" href={order.invoice.url} target="_blank" rel="noreferrer">
                Ver PDF actual
              </a>
            )}
          </div>
        </div>
      </div>

      {order.raw?.billing && (
        <div className="mt-3 grid gap-2 rounded-xl border border-slate-100 p-3 text-sm text-slate-700 md:grid-cols-3">
          <div>
            <div className="text-xs font-semibold text-slate-600">Facturación</div>
            <div className="font-semibold">{order.raw.billing.name || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Email</div>
            <div>{order.raw.billing.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">RFC</div>
            <div>{order.raw.billing.rfc || '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: Order['status'];
  onChange: (status: Order['status']) => void;
  disabled?: boolean;
}) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value as Order['status'])}
      disabled={disabled}
    >
      {statusOptions.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
