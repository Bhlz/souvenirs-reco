'use client';
import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from '@/lib/toast';
import type { Product } from '@/lib/types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = 'Error al cargar productos';
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

export default function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const { data, mutate, error, isLoading } = useSWR('/api/admin/products', fetcher, {
    fallbackData: { products: initialProducts },
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });
  const products = data?.products || initialProducts || [];
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(slug: string) {
    if (!confirm('¿Eliminar producto? Esta acción no se puede deshacer.')) return;
    setRemoving(slug);
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    setRemoving(null);
    if (!res.ok) {
      toast('Error al eliminar');
      return;
    }
    toast('Producto eliminado');
    mutate();
  }

  if (error) return <div className="text-red-600">{error.message}</div>;

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Productos</h2>
          <p className="text-sm text-slate-500">
            Gestiona catálogo, stock, galería de imágenes y variantes.
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          Nuevo producto
        </Link>
      </div>

      {isLoading && products.length === 0 && <div className="py-8 text-sm">Cargando productos…</div>}

      {products.length === 0 && !isLoading ? (
        <div className="py-8 text-sm text-slate-500">No hay productos cargados.</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.1em] text-slate-500">
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Imágenes</th>
                <th className="px-3 py-2">Variantes</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p: Product) => (
                <tr key={p.slug} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">/{p.slug}</div>
                  </td>
                  <td className="px-3 py-3 font-semibold">${p.price} MXN</td>
                  <td className="px-3 py-3 text-slate-700">{p.stock ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-700">{p.images?.length ?? 0}</td>
                  <td className="px-3 py-3 text-slate-700">{p.variants?.length ?? 0}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${p.slug}`} className="btn">
                        Editar
                      </Link>
                      <button
                        className="btn bg-red-50 text-red-700 hover:bg-red-100"
                        onClick={() => remove(p.slug)}
                        disabled={removing === p.slug}
                      >
                        {removing === p.slug ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
