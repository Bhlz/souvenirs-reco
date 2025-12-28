export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import Reveal from '@/components/ui/Reveal';
import { getAllProducts } from '@/lib/store';

export default async function CatalogoPage() {
  const products = await getAllProducts();

  return (
    <main className="pb-16">
      <section
        aria-label="Catálogo completo"
        className="relative overflow-hidden py-16 md:py-20"
      >
        <div className="absolute inset-0 -z-20 bg-[url('/uploads/fondo-catalogo.png')] bg-cover bg-center bg-fixed" />
        <div className="absolute inset-0 -z-10 bg-white/80" />
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-pink-400/30 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl animate-ping" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl animate-pulse" />

        <div className="container space-y-6">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.24em] text-brand">Catálogo</p>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Explora todos nuestros productos
            </h1>
            <p className="max-w-2xl text-neutral-700">
              Filtra, busca y encuentra el recuerdo perfecto. Todo lo que ofrecemos en un solo lugar.
            </p>
            <div className="h-[3px] w-24 rounded-full bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500 animate-pulse" />
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur-md shadow-xl">
              <ProductGrid products={products} />
            </div>
          </Reveal>

          <div className="pt-2">
            <Link href="/" className="text-sm text-brand underline-offset-4 hover:underline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
