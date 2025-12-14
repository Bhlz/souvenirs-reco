import Link from 'next/link';
import { getAllProducts, getOrders } from '@/lib/store';

const currency = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

export default async function AdminDashboard() {
  const [products, orders] = await Promise.all([getAllProducts(), getOrders()]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const pendingOrders = orders.filter((o) =>
    ['pending', 'in_process', 'unknown'].includes(o.status)
  ).length;
  const shippedOrders = orders.filter((o) => o.shipment?.status === 'shipped').length;
  const lowStock = products.filter((p) => (p.stock ?? 0) <= 5);
  const recentOrders = [...orders].slice(-5).reverse();
  const topProducts = [...products]
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-10">
      <div className="rounded-3xl bg-gradient-to-r from-amber-50 via-white to-emerald-50 p-6 shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-amber-600">Panel</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard de eCommerce</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Controla ventas, existencias y pedidos desde un solo lugar. Usa las tarjetas para navegar rápido a las acciones clave.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/orders" className="btn">Ver órdenes</Link>
              <Link href="/admin/products/new" className="btn-primary">Crear producto</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ingresos</p>
              <div className="mt-2 text-2xl font-bold">{currency(totalRevenue)}</div>
              <div className="text-xs text-slate-500">Acumulado (archivo local)</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Órdenes activas</p>
              <div className="mt-2 text-2xl font-bold">{pendingOrders}</div>
              <div className="text-xs text-slate-500">Pendientes o en proceso</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Enviadas</p>
              <div className="mt-2 text-2xl font-bold">{shippedOrders}</div>
              <div className="text-xs text-slate-500">Marcadas como enviadas</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Productos</p>
              <div className="mt-2 text-2xl font-bold">{products.length}</div>
              <div className="text-xs text-slate-500">Total en catálogo</div>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Órdenes recientes</h2>
              <p className="text-sm text-slate-500">Últimas 5 entradas registradas</p>
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
                <div className="text-sm text-slate-600">
                  Estado: <span className="font-semibold">{o.status}</span>
                </div>
                <div className="text-sm text-slate-600">
                  Envío: {o.shipment?.status ?? 'pending'}
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
                <div key={p.slug} className="rounded-xl border border-slate-100 px-3 py-2">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-600">Stock: {p.stock ?? 0}</div>
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
                    <div className="text-xs text-slate-600">
                      {p.reviews ?? 0} reseñas · {currency(p.price)}
                    </div>
                  </div>
                  <Link href={`/admin/products/${p.slug}`} className="text-xs text-brand underline-offset-4 hover:underline">
                    Editar
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Acciones rápidas</h2>
            <p className="text-sm text-slate-500">Lo esencial del día a día del eCommerce</p>
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
          <div className="card flex h-full flex-col justify-between bg-gradient-to-br from-slate-50 to-white p-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Próximamente</div>
              <p className="text-sm text-slate-600">Reportes y configuración avanzada.</p>
            </div>
            <span className="mt-3 text-sm text-slate-400">En desarrollo</span>
          </div>
        </div>
      </section>
    </div>
  );
}
