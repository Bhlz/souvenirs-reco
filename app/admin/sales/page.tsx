'use client';
import React from 'react';
import useSWR from 'swr';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, TrendingUp, Wallet, WalletMinimal, CalendarRange } from 'lucide-react';
import { toast } from '@/lib/toast';
import type { Sale } from '@/lib/sales';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = 'Error al cargar ventas';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg);
  }
  return res.json();
};

type RangeKey = 'today' | 'month' | 'custom';

const toLocalISO = (dateStr: string) => new Date(`${dateStr}T12:00:00`).toISOString();
const inputDateFromISO = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export default function SalesPage() {
  const { data, mutate, error, isLoading } = useSWR('/api/admin/sales', fetcher);
  const sales: Sale[] = data?.sales || [];
  const [form, setForm] = useState({
    name: '',
    quantity: 1,
    cost: 0,
    price: 0,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!sales.length) return [];
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (range === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
      const d = new Date(customDate);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    }

    return sales.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }, [sales, range, customDate]);

  const summary = useMemo(() => {
    const totals = filtered.reduce(
      (acc, s) => {
        const revenue = s.price * s.quantity;
        const cost = s.cost * s.quantity;
        acc.revenue += revenue;
        acc.cost += cost;
        acc.profit += revenue - cost;
        acc.units += s.quantity;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0, units: 0 }
    );
    return totals;
  }, [filtered]);

  const bars = useMemo(() => {
    const buckets: Record<string, { label: string; revenue: number }> = {};
    filtered.forEach((s) => {
      const d = new Date(s.date);
      const label =
        range === 'today'
          ? `${String(d.getHours()).padStart(2, '0')}:00`
          : `${d.getDate()}/${d.getMonth() + 1}`;
      buckets[label] = buckets[label] || { label, revenue: 0 };
      buckets[label].revenue += s.price * s.quantity;
    });
    return Object.values(buckets).sort((a, b) => {
      if (range === 'today') {
        const ha = Number(a.label.split(':')[0] || 0);
        const hb = Number(b.label.split(':')[0] || 0);
        return ha - hb;
      }
      const [da, ma] = a.label.split('/').map(Number);
      const [db, mb] = b.label.split('/').map(Number);
      return new Date(2020, ma - 1, da).getTime() - new Date(2020, mb - 1, db).getTime();
    });
  }, [filtered, range]);
  const recentSales = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      quantity: Number(form.quantity),
      cost: Number(form.cost),
      price: Number(form.price),
      date: toLocalISO(form.date),
      note: form.note,
      id: editingId || undefined,
    };
    const res = await fetch('/api/admin/sales', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      toast('Error al guardar venta');
      return;
    }
    resetForm();
    toast(editingId ? 'Venta actualizada' : 'Venta registrada');
    mutate();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      quantity: 1,
      cost: 0,
      price: 0,
      date: new Date().toISOString().slice(0, 10),
      note: '',
    });
  };

  const onEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setForm({
      name: sale.name,
      quantity: sale.quantity,
      cost: sale.cost,
      price: sale.price,
      date: inputDateFromISO(sale.date),
      note: sale.note || '',
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onDelete = async (sale: Sale) => {
    if (!confirm(`¿Eliminar la venta "${sale.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    const res = await fetch(`/api/admin/sales?id=${sale.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast('Venta eliminada');
      mutate();
    } else {
      toast('Error al eliminar venta');
    }
  };

  const currency = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div className="container space-y-8 pb-12 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ventas</p>
          <h1 className="text-2xl font-bold text-slate-900">Ventas físicas y manuales</h1>
          <p className="text-sm text-slate-500">Registra tickets de tienda física y monitorea utilidad.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message || 'No se pudieron cargar las ventas.'}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Gráfica de ventas</h2>
              <p className="text-sm text-slate-500">Ingresos por hora o día según el rango.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['today', 'month', 'custom'] as RangeKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`rounded-full px-3 py-2 text-sm transition ${range === key ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {key === 'today' ? 'Hoy' : key === 'month' ? 'Mes' : 'Fecha'}
                </button>
              ))}
              {range === 'custom' && (
                <input
                  type="date"
                  className="input h-[42px]"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-900 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.12),transparent_28%)]" />
            <div className="relative z-10 space-y-4 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-amber-200 ring-1 ring-white/10">
                  Ingresos
                </span>
                <span className="text-xs text-white/70">Animación 0 → total</span>
              </div>
              <BarChart bars={bars} currency={currency} />
            </div>
          </div>

          <SalesList sales={recentSales} currency={currency} isLoading={isLoading} />
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Registrar venta</h2>
                <p className="text-sm text-slate-500">
                  {editingId ? 'Edita los datos y guarda cambios.' : 'Registra una venta manual o de tienda física.'}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {editingId ? 'Editando' : 'Ticket físico'}
              </div>
            </div>
            <form onSubmit={submit} className="mt-5 space-y-4">
              {/* Nombre del producto */}
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  Nombre del producto
                  <span className="tooltip-trigger">
                    ?
                    <span className="tooltip-content">
                      Identificador de la venta. Puede ser el nombre del producto o una descripción (ej: "Alebrije grande rojo", "3 llaveros mixtos")
                    </span>
                  </span>
                </label>
                <input
                  className="input"
                  placeholder="Ej: Alebrije mediano color azul"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* Cantidad y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-medium text-slate-700">
                    Cantidad
                    <span className="tooltip-trigger">
                      ?
                      <span className="tooltip-content">
                        Número de unidades vendidas en esta transacción
                      </span>
                    </span>
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    placeholder="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Fecha de venta</label>
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Costo y Precio */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-medium text-slate-700">
                    Costo unitario
                    <span className="tooltip-trigger">
                      ?
                      <span className="tooltip-content">
                        Lo que te costó adquirir o producir CADA unidad. Sirve para calcular tu utilidad real.
                      </span>
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      className="input pl-7"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center text-sm font-medium text-slate-700">
                    Precio de venta
                    <span className="tooltip-trigger">
                      ?
                      <span className="tooltip-content">
                        Precio al que vendiste CADA unidad al cliente. La utilidad se calcula como: (Precio - Costo) × Cantidad
                      </span>
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                      className="input pl-7"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Utilidad calculada (preview) */}
              {form.price > 0 && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-700">Utilidad estimada:</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {((form.price - form.cost) * form.quantity).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">
                    ({currency(form.price)} - {currency(form.cost)}) × {form.quantity} uds
                  </p>
                </div>
              )}

              {/* Nota opcional */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 field-optional">Nota</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Información adicional: cliente, método de pago, etc."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <button
                className="btn-primary w-full justify-center"
                type="submit"
                disabled={saving}
              >
                <Plus className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar venta'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn w-full justify-center border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  onClick={resetForm}
                >
                  Cancelar edición
                </button>
              )}
            </form>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Resumen</h3>
            <div className="mt-4 grid gap-3">
              <Stat
                icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
                label="Ingresos"
                value={currency(summary.revenue)}
              />
              <Stat
                icon={<Wallet className="h-4 w-4 text-amber-600" />}
                label="Costo"
                value={currency(summary.cost)}
              />
              <Stat
                icon={<WalletMinimal className="h-4 w-4 text-slate-900" />}
                label="Utilidad"
                value={currency(summary.profit)}
              />
              <Stat
                icon={<CalendarRange className="h-4 w-4 text-slate-700" />}
                label="Unidades"
                value={`${summary.units} uds`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ventas en el rango</h2>
            <p className="text-sm text-slate-500">Detalle de tickets capturados.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.1em] text-slate-500">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Costo</th>
                <th className="px-3 py-2">Venta</th>
                <th className="px-3 py-2">Utilidad</th>
                <th className="px-3 py-2">Nota</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-sm text-slate-500">
                    Cargando...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-sm text-slate-500">
                    Sin ventas en este rango.
                  </td>
                </tr>
              )}
              {filtered.map((s) => {
                const revenue = s.price * s.quantity;
                const cost = s.cost * s.quantity;
                const profit = revenue - cost;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 text-slate-700">
                      {new Date(s.date).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-3 py-2 text-slate-700">{s.quantity}</td>
                    <td className="px-3 py-2 text-slate-700">{currency(cost)}</td>
                    <td className="px-3 py-2 text-slate-700">{currency(revenue)}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-700">{currency(profit)}</td>
                    <td className="px-3 py-2 text-slate-500">{s.note || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-sm text-brand underline-offset-4 hover:underline"
                          onClick={() => onEdit(s)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm text-red-600 underline-offset-4 hover:underline"
                          onClick={() => onDelete(s)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type Bar = { label: string; revenue: number };

function BarChart({ bars, currency }: { bars: Bar[]; currency: (n: number) => string }) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const max = Math.max(...bars.map((b) => b.revenue), 1);
  const total = bars.reduce((sum, b) => sum + b.revenue, 0);
  const chartWidth = 100;
  const chartHeight = 180;
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  if (bars.length === 0) {
    return (
      <div className="h-56 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70 flex items-center justify-center">
        <div>
          <svg className="mx-auto h-12 w-12 text-white/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Sin datos en el rango seleccionado
        </div>
      </div>
    );
  }

  // Generate points for the line/area
  const points = bars.map((bar, i) => {
    const x = padding.left + (i / (bars.length - 1 || 1)) * innerWidth;
    const y = padding.top + innerHeight - (bar.revenue / max) * innerHeight;
    return { x, y, ...bar, index: i };
  });

  // Create SVG path for smooth curve (using bezier curves)
  const linePath = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 3;
    const cp2x = prev.x + 2 * (point.x - prev.x) / 3;
    return `${path} C ${cp1x},${prev.y} ${cp2x},${point.y} ${point.x},${point.y}`;
  }, '');

  // Area path (closes the line to bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x},${padding.top + innerHeight} L ${points[0].x},${padding.top + innerHeight} Z`;

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padding.top + innerHeight * (1 - pct),
    value: max * pct,
  }));

  return (
    <div className="relative">
      {/* Header with total */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-3xl font-bold text-white animate-count-up">{currency(total)}</div>
          <div className="text-xs text-white/60 mt-1">Total en el período</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs text-emerald-300 font-medium">Actualizado</span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-48"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="rgb(16, 185, 129)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
          </linearGradient>
          {/* Gradient for line */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(52, 211, 153)" />
            <stop offset="50%" stopColor="rgb(16, 185, 129)" />
            <stop offset="100%" stopColor="rgb(5, 150, 105)" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={chartWidth - padding.right}
              y2={line.y}
              className="chart-grid-line"
            />
            <text
              x={chartWidth - padding.right + 2}
              y={line.y}
              className="fill-white/40 text-[3px]"
              dominantBaseline="middle"
            >
              {currency(line.value).replace('MX$', '')}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          className="chart-area"
        />

        {/* Main line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          className="chart-line"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === i ? 2.5 : 1.5}
              className={`transition-all duration-200 ${hoveredIndex === i
                ? 'fill-white stroke-emerald-400 stroke-1'
                : 'fill-emerald-400 stroke-none'
                }`}
              style={{ animationDelay: `${i * 100}ms` }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
            {/* X-axis labels */}
            <text
              x={point.x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="fill-white/60 text-[3px] font-medium"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="chart-tooltip visible"
          style={{
            left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
            bottom: '75%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-emerald-600 font-bold">{currency(points[hoveredIndex].revenue)}</div>
          <div className="text-slate-500 text-xs">{points[hoveredIndex].label}</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          <span className="text-white/60">Ingresos por período</span>
        </div>
      </div>
    </div>
  );
}

function SalesList({
  sales,
  currency,
  isLoading,
}: {
  sales: Sale[];
  currency: (n: number) => string;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Ventas recientes</h3>
          <p className="text-xs text-slate-600">Justo debajo de la gráfica para revisión rápida.</p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-100">
          {sales.length} en rango
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {isLoading && (
          <div className="rounded-xl bg-white px-3 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
            Cargando ventas...
          </div>
        )}
        {!isLoading && sales.length === 0 && (
          <div className="rounded-xl bg-white px-3 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
            Sin ventas en este rango.
          </div>
        )}
        {!isLoading &&
          sales.slice(0, 6).map((s) => {
            const revenue = s.price * s.quantity;
            const cost = s.cost * s.quantity;
            const profit = revenue - cost;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                  <div className="text-[11px] text-slate-600">
                    {new Date(s.date).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                    })}{' '}
                    · {s.quantity} uds
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-emerald-700">
                  {currency(revenue)}
                  <div className="text-[11px] font-normal text-slate-500">Utilidad {currency(profit)}</div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow">{icon}</div>
        <div className="text-sm font-semibold text-slate-800">{label}</div>
      </div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
