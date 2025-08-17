import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts } from '@/lib/store';

export default async function Collections() {
  const items = (await getAllProducts()).slice(0, 8);
  return (
    <section id="colecciones" className="container py-10 md:py-16">
      <h2 className="section-title">Best sellers y colecciones</h2>
      <p className="mt-2 text-neutral-600">Compra rápido por categoría o arma tu kit de regalo.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((p) => (
          <Link key={p.slug} href={`/product/${p.slug}`} className="group card p-0 overflow-hidden">
            <div className="relative aspect-square">
              <Image src={p.images[0]} alt={p.name} fill className="object-cover transition group-hover:scale-105"/>
            </div>
            <div className="p-4">
              <div className="font-semibold line-clamp-1">{p.name}</div>
              <div className="mt-1 text-sm text-neutral-600">${p.price} MXN</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
