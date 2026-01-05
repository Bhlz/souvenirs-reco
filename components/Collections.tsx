import Image from 'next/image';
import Link from 'next/link';
import { getAllProducts } from '@/lib/store';

export default async function Collections() {
  let all: any[] = [];
  try {
    all = await getAllProducts();
  } catch (err) {
    console.error('Collections failed:', err);
    return null; // Ocultar sección si falla
  }

  // 4 destacados por rating (o curado si quieres por slug)
  const items = [...all].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4);

  return (
    <section id="colecciones" className="relative overflow-hidden py-14">
      <div className="absolute inset-0 -z-10 bg-[url('/uploads/fondo-productos.png')] bg-cover bg-center opacity-10" />
      <div className="container">
        <h2 className="section-title">Destacados</h2>
        <p className="mt-2 text-neutral-700">Selección especial de la semana.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {items.map(p => {
            const cover = (p.images ?? []).find(s => !!s && s.trim() !== '') || '/logos/LogosouvenirsGreco.jpg';
            return (
              <Link key={p.slug} href={`/product/${p.slug}`} className="group card overflow-hidden p-0">
                <div className="relative aspect-[4/3]">
                  <Image src={cover} alt={p.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <div className="line-clamp-1 font-semibold">{p.name}</div>
                  <div className="mt-1 text-sm text-neutral-600">${p.price} MXN</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <Link href="/catalogo" className="btn">Ver todo el catálogo</Link>
        </div>
      </div>
    </section>
  );
}
