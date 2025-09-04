import Hero from '@/components/Hero';
import Collections from '@/components/Collections';
import ReviewsUGC from '@/components/ReviewsUGC';
import Benefits from '@/components/Benefits';
import Story from '@/components/Story';
import LocationSection from '@/components/LocationSection';
import FAQ from '@/components/FAQ';
import ProductGrid from '@/components/ProductGrid';
import { getAllProducts } from '@/lib/store';
import Reveal from '@/components/ui/Reveal';

export default async function Page() {
  const products = await getAllProducts();

  return (
    <>
      <Hero/>

      {/* Catálogo con fondo e interacciones */}
      <section
        id="catalogo"
        aria-label="Catálogo"
        className="relative overflow-hidden py-16 scroll-mt-28 md:scroll-mt-36"
      >
        {/* Fondo: tu imagen local en public/uploads/fondo-catalogo.png */}
        <div className="absolute inset-0 -z-20 bg-[url('/uploads/fondo-catalogo.png')] bg-cover bg-center bg-fixed" />

        {/* Velo para mejorar contraste del contenido */}
        <div className="absolute inset-0 -z-10 bg-white/70" />

        {/* Orbes/luces animadas (sutiles) */}
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-pink-400/30 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl animate-ping" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl animate-pulse" />

        <div className="container">
          <Reveal>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight">Catálogo</h2>
            {/* Subrayado animado */}
            <div className="mb-6 h-[3px] w-24 rounded-full bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500 animate-pulse" />
          </Reveal>

          {/* Contenedor “glass” para el grid */}
          <Reveal delay={100}>
            <div className="rounded-3xl border border-white/60 bg-white/60 p-4 backdrop-blur-md shadow-xl">
              <ProductGrid products={products} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Resto de secciones */}
      <Collections/>
      <ReviewsUGC/>
      <Benefits/>
      <Story/>
      <LocationSection/>
      <FAQ/>
    </>
  );
}
