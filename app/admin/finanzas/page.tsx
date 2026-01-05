'use client';
import { useState } from 'react';
import useSWR from 'swr';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent,
  Package, Truck, CreditCard, RotateCcw, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const currency = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export default function FinanzasPage() {
  const [period, setPeriod] = useState('30d');
  const { data, error, isLoading } = useSWR(`/api/admin/finanzas?period=${period}`, fetcher, {
    refreshInterval: 30000,
  });

  const exportCSV = (type: 'sales' | 'orders') => {
    if (!data) return;

    const items = type === 'sales' ? data.rawSales : data.rawOrders;
    const headers = type === 'sales'
      ? ['ID', 'Fecha', 'Nombre', 'Cantidad', 'Ingresos', 'Costo', 'Canal']
      : ['ID', 'Fecha', 'Total', 'Estado', 'Reembolso', 'Estado Reembolso'];

    const rows = items.map((item: any) => {
      if (type === 'sales') {
        return [item.id, new Date(item.date).toLocaleDateString(), item.name, item.quantity, item.revenue, item.cost, item.channel];
      }
      return [item.id, new Date(item.date).toLocaleDateString(), item.total, item.status, item.refundAmount, item.refundStatus || '-'];
    });

    const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${period}.csv`;
    a.click();
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-50 p-4 text-red-700">
          Error al cargar datos financieros
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-6 pb-12 pt-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Finanzas</p>
          <h1 className="text-2xl font-bold text-slate-900">Panel Financiero</h1>
          <p className="text-sm text-slate-500">Control de ingresos, costos y utilidad real</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          {['today', '7d', 'mtd', '30d'].map((p) => (
            <button
              key={p}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${period === p
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              onClick={() => setPeriod(p)}
            >
              {p === 'today' ? 'Hoy' : p === 'mtd' ? 'Mes' : p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        </div>
      ) : data && (
        <>
          {/* KPIs */}
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              icon={<DollarSign className="h-5 w-5" />}
              label="Ventas Netas"
              value={currency(data.kpis.netRevenue)}
              change={data.kpis.revenueChange}
              color="emerald"
            />
            <KPICard
              icon={<ShoppingCart className="h-5 w-5" />}
              label="Transacciones"
              value={data.kpis.transactions}
              sublabel={`AOV: ${currency(data.kpis.aov)}`}
              color="blue"
            />
            <KPICard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Utilidad Bruta"
              value={currency(data.kpis.grossProfit)}
              sublabel={`${data.kpis.grossMargin}% margen`}
              color="amber"
            />
            <KPICard
              icon={<Percent className="h-5 w-5" />}
              label="Contribución"
              value={currency(data.kpis.contribution)}
              sublabel={`${data.kpis.contributionMargin}% margen real`}
              color="purple"
              highlight
            />
          </section>

          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Ventas */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Ventas</h2>
              <div className="mt-4 space-y-3">
                <Row label="Ventas Brutas" value={currency(data.sales.gross)} />
                <Row label="Descuentos" value={`-${currency(data.sales.discounts)}`} negative />
                <div className="border-t border-slate-100 pt-3">
                  <Row label="Ventas Netas" value={currency(data.sales.net)} bold />
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Por Canal</p>
                  <div className="flex gap-4">
                    <div className="flex-1 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Físico</p>
                      <p className="text-lg font-bold text-slate-900">{currency(data.sales.byChannel.physical.revenue)}</p>
                      <p className="text-xs text-slate-500">{data.sales.byChannel.physical.count} ventas</p>
                    </div>
                    <div className="flex-1 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Online</p>
                      <p className="text-lg font-bold text-slate-900">{currency(data.sales.byChannel.online.revenue)}</p>
                      <p className="text-xs text-slate-500">{data.sales.byChannel.online.count} órdenes</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Costos */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Costos Variables</h2>
              <div className="mt-4 space-y-3">
                <RowIcon icon={<Package className="h-4 w-4" />} label="COGS (Costo producto)" value={currency(data.costs.cogs)} />
                <RowIcon icon={<CreditCard className="h-4 w-4" />} label="Fees de pasarela" value={currency(data.costs.paymentFees)} />
                <RowIcon icon={<Truck className="h-4 w-4" />} label="Costo de envíos" value={currency(data.costs.shippingCosts)} />
                <RowIcon icon={<Package className="h-4 w-4" />} label="Empaque" value={currency(data.costs.packaging)} />
                <div className="border-t border-slate-100 pt-3">
                  <Row label="Total Costos" value={currency(data.costs.total)} bold />
                </div>
              </div>
            </section>

            {/* Devoluciones */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <RotateCcw className="h-5 w-5 text-red-500" />
                Devoluciones
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{currency(data.refunds.amount)}</p>
                  <p className="text-xs text-red-600">Reembolsado</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{data.refunds.rate}%</p>
                  <p className="text-xs text-slate-500">Tasa</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">{data.refunds.pending}</p>
                  <p className="text-xs text-amber-600">Pendientes</p>
                </div>
              </div>
            </section>

            {/* Payouts */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Payouts y Conciliación</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-600 font-medium">Recibido</p>
                  <p className="text-2xl font-bold text-emerald-700">{currency(data.payouts.received)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs text-amber-600 font-medium">En tránsito</p>
                  <p className="text-2xl font-bold text-amber-700">{currency(data.payouts.pending)}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Exportar */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Exportar Reportes</h2>
            <p className="text-sm text-slate-500">Descarga los datos del período seleccionado</p>
            <div className="mt-4 flex gap-3">
              <button
                className="btn bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => exportCSV('sales')}
              >
                <Download className="mr-2 h-4 w-4" />
                Ventas CSV
              </button>
              <button
                className="btn bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => exportCSV('orders')}
              >
                <Download className="mr-2 h-4 w-4" />
                Órdenes CSV
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// Components
function KPICard({
  icon,
  label,
  value,
  change,
  sublabel,
  color,
  highlight
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  sublabel?: string;
  color: 'emerald' | 'blue' | 'amber' | 'purple';
  highlight?: boolean;
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const isPositive = change && !change.startsWith('-');

  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${highlight ? 'ring-purple-200 ring-2' : 'ring-slate-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${colors[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-slate-900">{value}</p>
            {change && (
              <span className={`flex items-center text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {change}%
              </span>
            )}
          </div>
          {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, negative }: { label: string; value: string; bold?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-slate-900' : ''} ${negative ? 'text-red-600' : ''}`}>{value}</span>
    </div>
  );
}

function RowIcon({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}
