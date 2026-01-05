export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Link from 'next/link';
import Hero from '@/components/Hero';
import Collections from '@/components/Collections';
import ReviewsUGC from '@/components/ReviewsUGC';
import Benefits from '@/components/Benefits';
import Story from '@/components/Story';
import LocationSection from '@/components/LocationSection';
import FAQ from '@/components/FAQ';
import ProductCard from '@/components/ProductCard';
import { getAllProducts } from '@/lib/store';
import Reveal from '@/components/ui/Reveal';

export default async function Page() {
  let products: any[] = [];
  try {
    products = await getAllProducts();
  } catch (error) {
    console.error('FAILED TO LOAD PRODUCTS:', error);
  }
  const featured = products.slice(0, 3);

  return (
    <>
      <Hero />

      {/* Destacados (solo algunos productos) */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-50 via-white to-emerald-50" />

        <div className="container">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.24em] text-brand">Productos destacados</p>
            <h2 className="text-3xl font-extrabold tracking-tight">Lo más querido por nuestros clientes</h2>
            <p className="mt-2 max-w-2xl text-neutral-700">
              Una selección rápida para comprar sin perderte. El catálogo completo ahora vive en su propia página.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/catalogo" className="btn-primary px-6">
                Ver más
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Resto de secciones */}
      <Collections />
      <ReviewsUGC />
      <Benefits />
      <Story />
      <LocationSection />
      <FAQ />
    </>
  );
}
