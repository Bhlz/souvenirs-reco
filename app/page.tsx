import Hero from '@/components/Hero';
import Collections from '@/components/Collections';
import ReviewsUGC from '@/components/ReviewsUGC';
import Benefits from '@/components/Benefits';
import Story from '@/components/Story';
import FAQ from '@/components/FAQ';

import ProductGrid from '@/components/ProductGrid';
import { getAllProducts } from '@/lib/store';

export default async function Page() {
  const products = await getAllProducts();

  return (
    <>
      <Hero/>

      <section id="catalogo" className="container py-10">
        <h2 className="mb-4 text-2xl font-bold">Catálogo</h2>
        <ProductGrid products={products} />
      </section>

      <Collections/>
      <ReviewsUGC/>
      <Benefits/>
      <Story/>
      <FAQ/>
    </>
  );
}
