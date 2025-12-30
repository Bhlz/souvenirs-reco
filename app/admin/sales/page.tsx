'use client';
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
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    range === key ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                  {editingId ? 'Edita los datos y guarda cambios.' : 'Costo, precio de venta y utilidad calculada.'}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {editingId ? 'Editando' : 'Ticket físico'}
              </div>
            </div>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input
                className="input"
                placeholder="Nombre del producto/venta"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  type="number"
                  min={1}
                  placeholder="Cantidad"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 1 })}
                  required
                />
                <input
                  className="input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Costo unitario"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: Number(e.target.value) || 0 })}
                />
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Precio venta"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
                  required
                />
              </div>
              <textarea
                className="input"
                placeholder="Nota (opcional)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
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
                      <button
                        className="text-sm text-brand underline-offset-4 hover:underline"
                        onClick={() => onEdit(s)}
                      >
                        Editar
                      </button>
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
  const max = Math.max(...bars.map((b) => b.revenue), 0);

  if (bars.length === 0) {
    return (
      <div className="h-56 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
        Sin datos en el rango seleccionado.
      </div>
    );
  }

  return (
    <>
      <div className="flex h-56 items-end gap-3">
        {bars.map((bar, idx) => {
          const height = max > 0 ? Math.max(10, (bar.revenue / max) * 180) : 10;
          return (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="bar-fill w-full rounded-md bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-lg shadow-emerald-700/20 ring-1 ring-white/20"
                  style={{ height, animationDelay: `${idx * 80}ms` }}
                  title={currency(bar.revenue)}
                />
              </div>
              <div className="text-[11px] font-semibold text-white/80">{bar.label}</div>
              <div className="text-[11px] text-amber-100">{currency(bar.revenue)}</div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .bar-fill {
          transform-origin: bottom;
          animation: growBar 700ms ease-out forwards;
        }
        @keyframes growBar {
          from {
            transform: scaleY(0);
            opacity: 0.5;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
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
