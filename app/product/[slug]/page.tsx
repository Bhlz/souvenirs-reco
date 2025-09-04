// app/product/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getAllProducts, getProduct } from '@/lib/store';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import ProductInfo from '@/components/ProductInfo'; // ← componente cliente
import type { Product as Prod } from '@/lib/types';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);
  if (!p) return notFound();

  const others = (await getAllProducts())
    .filter(x => x.slug !== p.slug)
    .slice(0, 4);

  const images = (p.images ?? []).filter(s => !!s && s.trim() !== '');

  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={images} name={p.name} />
        <ProductInfo p={p as Prod} />
      </div>

      <div className="mt-12">
        <h2 className="section-title">También te puede gustar</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {others.map(x => (
            <ProductCard key={x.slug} p={x as any} />
          ))}
        </div>
      </div>
    </div>
  );
}
