import { getAllProducts, getProduct } from "@/lib/store";
import AddToCartButtons from "@/components/AddToCartButtons";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;              // 👈 importante en Next 15

  const p = await getProduct(slug);
  if (!p) return <div className="container py-10">Producto no encontrado</div>;

  const others = (await getAllProducts()).filter(x => x.slug !== p.slug).slice(0, 4);

  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={p.images ?? []} name={p.name} />
        <div>
          <h1 className="text-3xl font-bold">{p.name}</h1>
          <div className="mt-2 text-neutral-600">{p.rating} ★ ({p.reviews} reseñas)</div>
          <div className="mt-3 text-2xl font-bold">${p.price} MXN</div>
          <div className="mt-2 text-sm text-neutral-600">
            Aceptamos tarjetas, MSI en campañas, SPEI, OXXO Pay y PayPal.
          </div>

          {p.variants?.map(v => (
            <div key={v.name} className="mt-4">
              <div className="text-sm font-medium">{v.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {v.values.map(val => (
                  <button key={val} className="rounded-xl border px-3 py-2 text-sm hover:border-brand">{val}</button>
                ))}
              </div>
            </div>
          ))}

          <AddToCartButtons slug={p.slug} />

          <div className="mt-6 space-y-2 text-sm text-neutral-700">
            <div><strong>Envío:</strong> 24–72h (estimado por CP al pagar)</div>
            <div><strong>Devoluciones:</strong> 30 días sin complicaciones</div>
            <div><strong>Descripción:</strong> {p.description}</div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="section-title">También te puede gustar</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {others.map(x => <ProductCard key={x.slug} p={x} />)}
        </div>
      </div>
    </div>
  );
}
