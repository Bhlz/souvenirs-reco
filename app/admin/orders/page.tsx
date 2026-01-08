'use client';
import useSWR from 'swr';
import { useMemo, useState, useEffect } from 'react';
import { CheckCircle, Clock, Package, RefreshCcw, Truck, XCircle, ChevronDown, ChevronUp, User, Mail, Phone } from 'lucide-react';
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

const currency = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

// Mapeo de estados a español con colores
const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  approved: { label: 'Pagado', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle className="h-4 w-4" /> },
  pending: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-100', icon: <Clock className="h-4 w-4" /> },
  in_process: { label: 'Procesando', color: 'text-blue-700', bg: 'bg-blue-100', icon: <Clock className="h-4 w-4" /> },
  rejected: { label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="h-4 w-4" /> },
  unknown: { label: 'Desconocido', color: 'text-slate-700', bg: 'bg-slate-100', icon: <Clock className="h-4 w-4" /> },
};

const shipmentConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Sin enviar', color: 'text-slate-600', bg: 'bg-slate-100' },
  shipped: { label: 'Enviado', color: 'text-blue-700', bg: 'bg-blue-100' },
  delivered: { label: 'Entregado', color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

export default function AdminOrders() {
  const { data, mutate, error, isLoading, isValidating } = useSWR('/api/admin/orders', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });
  const orders: (Order & { createdAt?: string })[] = data?.orders || [];
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'pending') return orders.filter(o => o.status === 'pending' || o.status === 'in_process');
    return orders.filter(o => o.status === 'approved');
  }, [orders, filter]);

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

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('¿Eliminar esta orden? Esta acción no se puede deshacer.')) return;
    setLoadingId(id);
    const res = await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
    setLoadingId(null);
    if (res.ok) {
      toast('Orden eliminada');
      mutate();
    } else {
      toast('Error al eliminar orden');
    }
  };

  if (error) return <div className="container py-10 text-red-600">{error.message}</div>;
  if (isLoading) return <div className="container py-10">Cargando órdenes…</div>;

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'in_process').length,
    approved: orders.filter(o => o.status === 'approved').length,
  };

  return (
    <div className="container space-y-6 pb-10 pt-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operación</p>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          <RefreshCcw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
          {isValidating ? 'Sincronizando…' : 'Actualizado'}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl p-4 text-left transition ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-100'}`}
        >
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm opacity-70">Todas las órdenes</div>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-xl p-4 text-left transition ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-white ring-1 ring-slate-100'}`}
        >
          <div className="text-2xl font-bold">{stats.pending}</div>
          <div className="text-sm opacity-70">Pendientes de pago</div>
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`rounded-xl p-4 text-left transition ${filter === 'approved' ? 'bg-emerald-500 text-white' : 'bg-white ring-1 ring-slate-100'}`}
        >
          <div className="text-2xl font-bold">{stats.approved}</div>
          <div className="text-sm opacity-70">Pagadas</div>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-100">
            No hay órdenes en esta categoría.
          </div>
        )}
        {filteredOrders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            loading={loadingId === o.id}
            onSave={(patch) => updateOrder(o.id, patch)}
            onDelete={() => handleDeleteOrder(o.id)}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onSave,
  onDelete,
  loading,
}: {
  order: Order & { createdAt?: string };
  loading: boolean;
  onSave: (patch: Partial<Order>) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [shipmentStatus, setShipmentStatus] = useState<'pending' | 'shipped' | 'delivered'>(
    (order.shipmentInfo?.status as 'pending' | 'shipped' | 'delivered') || 'pending'
  );
  const [tracking, setTracking] = useState(order.shipmentInfo?.tracking || '');
  const [carrier, setCarrier] = useState(order.shipmentInfo?.carrier || '');

  useEffect(() => {
    setShipmentStatus(order.shipmentInfo?.status || 'pending');
    setTracking(order.shipmentInfo?.tracking || '');
    setCarrier(order.shipmentInfo?.carrier || '');
  }, [order.shipmentInfo]);

  const status = statusConfig[order.status] || statusConfig.unknown;
  const shipment = shipmentConfig[order.shipmentInfo?.status || 'pending'];
  const total = currency(order.total ?? 0);
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : '';

  const saveShipping = async () => {
    await onSave({
      shipmentInfo: { status: shipmentStatus as any, tracking: tracking || undefined, carrier: carrier || undefined },
    });
  };

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      {/* Header - Always visible */}
      <button
        className="w-full p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 text-left">
          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
            {status.icon}
            {status.label}
          </div>

          {/* Order Info */}
          <div>
            <div className="font-semibold text-slate-900">
              Orden #{order.id.slice(0, 8)}
            </div>
            <div className="text-xs text-slate-500">{date}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Products Summary */}
          <div className="hidden sm:block text-right">
            <div className="text-sm text-slate-600">
              {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
            </div>
            <div className="font-semibold text-slate-900">{total}</div>
          </div>

          {/* Shipment Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${shipment.bg} ${shipment.color}`}>
            <Truck className="h-3.5 w-3.5" />
            {shipment.label}
          </div>

          {/* Expand Toggle */}
          <div className="text-slate-400">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Mobile: Total and Shipment */}
          <div className="sm:hidden flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-sm text-slate-600">{order.items.length} productos</div>
              <div className="font-semibold text-slate-900">{total}</div>
            </div>
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${shipment.bg} ${shipment.color}`}>
              <Truck className="h-3.5 w-3.5" />
              {shipment.label}
            </div>
          </div>

          {/* Products */}
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Productos</div>
            <div className="space-y-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{it.name || it.slug}</span>
                    <span className="text-slate-500">×{it.qty}</span>
                  </div>
                  <span className="text-slate-700">{currency(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          {order.billing && (order.billing.name || order.billing.email || order.billing.phone) && (
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cliente</div>
              <div className="flex flex-wrap gap-4 text-sm">
                {order.billing.name && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                    {order.billing.name}
                  </div>
                )}
                {order.billing.email && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {order.billing.email}
                  </div>
                )}
                {order.billing.phone && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {order.billing.phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Controls - Only for approved orders */}
          {order.status === 'approved' && (
            <div className="rounded-lg border border-slate-200 p-3 space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestionar Envío</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Estado</label>
                  <select
                    className="input"
                    value={shipmentStatus}
                    onChange={(e) => setShipmentStatus(e.target.value as 'pending' | 'shipped' | 'delivered')}
                    disabled={loading}
                  >
                    <option value="pending">Sin enviar</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Paquetería</label>
                  <input
                    className="input"
                    placeholder="FedEx, DHL..."
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Número de guía</label>
                  <input
                    className="input"
                    placeholder="000-000-000"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                className="btn-primary w-full sm:w-auto"
                onClick={saveShipping}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Actualizar envío'}
              </button>
            </div>
          )}

          {/* Delete Button */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              className="text-sm text-red-600 hover:text-red-700 hover:underline"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              disabled={loading}
            >
              Eliminar orden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
