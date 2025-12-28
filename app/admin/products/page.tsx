import Link from 'next/link';
import { getAllProducts } from '@/lib/store';
import ProductsTable from './_components/ProductsTable';

export default async function AdminProducts() {
  const products = await getAllProducts();

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Catálogo</p>
          <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/orders" className="btn">
            Órdenes
          </Link>
          <Link href="/admin/products/new" className="btn-primary">
            Nuevo producto
          </Link>
        </div>
      </div>

      <ProductsTable initialProducts={products} />
    </div>
  );
}
