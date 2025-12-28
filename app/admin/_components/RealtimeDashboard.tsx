'use client';
import useSWR from 'swr';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Activity, Clock3, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import type { Product } from '@/lib/types';
import type { Order } from '@/lib/store';
import type { SalesSummary } from '@/lib/sales';

type Overview = {
  metrics: {
    totalRevenue: number;
    pendingOrders: number;
    shippedOrders: number;
    productCount: number;
    ordersCount: number;
  };
  lowStock: Product[];
  recentOrders: Order[];
  topProducts: Product[];
  salesSummary: SalesSummary;
  updatedAt: number;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = 'No se pudo cargar el dashboard';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg);
  }
  return res.json() as Promise<Overview>;
};

const currency = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const statusLabel = (status: Order['status']) => {
  switch (status) {
    case 'approved':
      return 'Aprobado';
    case 'pending':
      return 'Pendiente';
    case 'rejected':
      return 'Rechazado';
    case 'in_process':
      return 'En proceso';
    default:
      return status;
  }
};

export default function RealtimeDashboard({ initial }: { initial: Overview }) {
  const { data, error, isLoading } = useSWR('/api/admin/overview', fetcher, {
    fallbackData: initial,
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });

  const overview = data || initial;
  const { metrics, lowStock, recentOrders, topProducts, salesSummary } = overview;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-amber-50 via-white to-emerald-50 p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-600">Panel</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard de eCommerce</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Métricas y alertas operativas en vivo. Actualización automática cada 5 segundos mientras mantengas la pestaña abierta.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/orders" className="btn">Ver órdenes</Link>
              <Link href="/admin/products/new" className="btn-primary">Crear producto</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <Activity className="h-4 w-4" />
            Tiempo real
            <span className="text-slate-500">
              {error
                ? 'sin conexión'
                : isLoading
                ? 'actualizando...'
                : `sincronizado hace ${Math.max(1, Math.round((Date.now() - (overview.updatedAt || Date.now())) / 1000))}s`}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message}
          </div>
        )}
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard
          title="Ingresos acumulados"
          value={currency(metrics.totalRevenue)}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          helper={`${metrics.ordersCount} órdenes registradas`}
        />
        <StatCard
          title="Órdenes activas"
          value={metrics.pendingOrders}
          icon={<Clock3 className="h-5 w-5 text-amber-600" />}
          helper="Pendientes o en proceso"
        />
        <StatCard
          title="Enviadas"
          value={metrics.shippedOrders}
          icon={<ShoppingCart className="h-5 w-5 text-sky-600" />}
          helper="Marcadas como enviadas"
        />
        <StatCard
          title="Catálogo"
          value={metrics.productCount}
          icon={<Package className="h-5 w-5 text-slate-700" />}
          helper="Productos publicados"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Órdenes recientes</h2>
              <p className="text-sm text-slate-500">Flujo en vivo de las últimas 10 órdenes</p>
            </div>
            <Link href="/admin/orders" className="text-sm text-brand underline-offset-4 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders.length === 0 && (
              <div className="py-6 text-sm text-slate-500">No hay órdenes aún.</div>
            )}
            {recentOrders.map((o) => (
              <div key={o.id} className="grid gap-2 py-3 sm:grid-cols-5 sm:items-center">
                <div className="text-sm font-semibold text-slate-800">#{o.id.slice(0, 8)}</div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <StatusPill status={o.status} />
                </div>
                <div className="text-sm text-slate-600">
                  Envío: <strong>{o.shipment?.status ?? 'pending'}</strong>
                </div>
                <div className="text-sm font-semibold text-emerald-700">{currency(o.total ?? 0)}</div>
                <div className="text-sm">
                  <Link href="/admin/orders" className="text-brand underline-offset-4 hover:underline">
                    Ver / actualizar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Stock bajo</h2>
              <Link href="/admin/products" className="text-sm text-brand underline-offset-4 hover:underline">
                Abrir productos
              </Link>
            </div>
            <div className="mt-3 space-y-3">
              {lowStock.length === 0 && <p className="text-sm text-slate-500">Todo con inventario suficiente.</p>}
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.slug} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-slate-600">Stock: {p.stock ?? 0}</div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                    Reponer
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Top productos</h2>
              <Link href="/admin/products" className="text-sm text-brand underline-offset-4 hover:underline">
                Gestionar
              </Link>
            </div>
            <div className="mt-3 space-y-3">
              {topProducts.map((p) => (
                <div key={p.slug} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-slate-600">{(p.reviews ?? 0)} reseñas · {currency(p.price)}</div>
                  </div>
                  <Link
                    href={`/admin/products/${p.slug}`}
                    className="text-xs text-brand underline-offset-4 hover:underline"
                  >
                    Editar
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Resumen de ventas físicas</h2>
              <Link href="/admin/sales" className="text-sm text-brand underline-offset-4 hover:underline">
                Ver ventas
              </Link>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Ingresos</span>
                <span className="font-semibold text-emerald-700">{currency(salesSummary.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Costos</span>
                <span className="font-semibold text-slate-800">{currency(salesSummary.totalCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Utilidad</span>
                <span className="font-semibold text-emerald-700">{currency(salesSummary.profit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Unidades</span>
                <span className="font-semibold text-slate-800">{salesSummary.totalUnits}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Acciones rápidas</h2>
            <p className="text-sm text-slate-500">Operaciones esenciales con datos actualizados</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/products/new" className="card flex h-full flex-col justify-between bg-gradient-to-br from-emerald-50 to-white p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Publicar producto</div>
              <p className="text-sm text-slate-600">Carga fotos, precios y stock.</p>
            </div>
            <span className="mt-3 text-sm text-brand underline-offset-4 hover:underline">Empezar</span>
          </Link>
          <Link href="/admin/orders" className="card flex h-full flex-col justify-between bg-gradient-to-br from-sky-50 to-white p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Revisar órdenes</div>
              <p className="text-sm text-slate-600">Actualiza estados y facturas.</p>
            </div>
            <span className="mt-3 text-sm text-brand underline-offset-4 hover:underline">Ir ahora</span>
          </Link>
          <Link href="/admin/products" className="card flex h-full flex-col justify-between bg-gradient-to-br from-amber-50 to-white p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Gestionar catálogo</div>
              <p className="text-sm text-slate-600">Editar precios, descripciones y stock.</p>
            </div>
            <span className="mt-3 text-sm text-brand underline-offset-4 hover:underline">Abrir</span>
          </Link>
          <Link href="/admin/sales" className="card flex h-full flex-col justify-between bg-gradient-to-br from-slate-50 to-white p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Registrar venta física</div>
              <p className="text-sm text-slate-600">Concilia tickets y costos.</p>
            </div>
            <span className="mt-3 text-sm text-brand underline-offset-4 hover:underline">Registrar</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  helper,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <div className="rounded-full bg-slate-100 p-2">{icon}</div>
        <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Tiempo real</div>
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-800">{title}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {helper && <div className="text-xs text-slate-500">{helper}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: Order['status'] }) {
  const label = statusLabel(status);
  const styles: Record<Order['status'], string> = {
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    pending: 'bg-amber-50 text-amber-700 ring-amber-100',
    rejected: 'bg-red-50 text-red-700 ring-red-100',
    in_process: 'bg-blue-50 text-blue-700 ring-blue-100',
    unknown: 'bg-slate-100 text-slate-700 ring-slate-200',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[status] || styles.unknown}`}>
      {label}
    </span>
  );
}
