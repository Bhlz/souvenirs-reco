'use client';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r=>r.json());

export default function AdminProducts() {
  const { data, mutate } = useSWR('/api/admin/products', fetcher);
  const products = data?.products || [];

  async function remove(slug: string) {
    if (!confirm('¿Eliminar producto?')) return;
    await fetch('/api/admin/products', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ slug })});
    mutate();
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <a href="/admin/orders" className="btn">Órdenes</a>
        <h1 className="text-2xl font-bold">Productos</h1>
        <Link href="/admin/products/new" className="btn-primary">Nuevo producto</Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {products.map((p: any) => (
          <div key={p.slug} className="card flex items-center justify-between">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-neutral-600">${p.price} MXN — stock: {p.stock}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/products/${p.slug}`} className="btn">Editar</Link>
              <button className="btn" onClick={()=>remove(p.slug)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
