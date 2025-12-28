import '../globals.css';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Home,
} from 'lucide-react';
import Toaster from '@/components/Toaster';
import { TrendingUp } from 'lucide-react';
import LogoutButton from './_components/LogoutButton';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Órdenes', icon: ShoppingCart },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/sales', label: 'Ventas', icon: TrendingUp },
  { href: '/admin/settings', label: 'Ajustes', icon: Settings, disabled: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Oculta la UI pública dentro de la sección admin */}
      <style>{`
        [data-public="true"], #freeshipping-bar, .whatsapp-button { display: none !important; }
      `}</style>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r bg-white/90 px-4 py-6 shadow-sm backdrop-blur lg:flex">
          <Link href="/" className="flex items-center gap-2 rounded-xl p-3 hover:bg-slate-100">
            <Home className="h-5 w-5 text-brand" />
            <div>
              <div className="text-sm font-semibold leading-tight text-brand">Souvenirs Greco</div>
              <div className="text-xs text-slate-500">Volver a la tienda</div>
            </div>
          </Link>
          <div className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Panel
          </div>
          <nav className="mt-2 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                className={[
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  item.disabled
                    ? 'cursor-not-allowed text-slate-400'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')}
                aria-disabled={item.disabled}
              >
                <item.icon className="h-4 w-4 text-brand" />
                {item.label}
                {item.disabled && (
                  <span className="ml-auto rounded-full bg-slate-100 px-2 text-[10px] font-semibold text-slate-500">
                    Próximamente
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-xl bg-gradient-to-br from-brand/10 via-white to-amber-50 p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-800">Atajos</div>
            <div className="mt-2 space-y-1">
              <Link href="/admin/products/new" className="block rounded-lg px-2 py-1 hover:bg-white/70">+ Nuevo producto</Link>
              <Link href="/admin/orders" className="block rounded-lg px-2 py-1 hover:bg-white/70">Ver órdenes</Link>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <div className="container flex h-16 items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Dashboard</div>
                <div className="text-lg font-semibold text-slate-900">Área administrativa</div>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/admin/products/new" className="btn-primary">Nuevo producto</Link>
                <Link href="/admin/orders" className="btn">Órdenes</Link>
                <LogoutButton />
              </div>
            </div>
          </header>

          <main className="container flex-1 pb-12 pt-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster/>
    </div>
  );
}
