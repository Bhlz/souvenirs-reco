'use client';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ImageUploader from '@/components/ImageUploader';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function EditProduct() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  // si tienes endpoint por slug, mejor:
  // const { data, error, isLoading } = useSWR(() => slug ? `/api/admin/products/${slug}` : null, fetcher);
  // const product = data?.product;

  // si no, filtra del listado
  const { data, error, isLoading } = useSWR('/api/admin/products', fetcher);
  const product = useMemo(
    () => (data?.products || []).find((p: any) => p.slug === slug),
    [data, slug]
  );

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        images: product.images?.join(', ') || '',
        variants: product.variants?.[0]?.values?.join(', ') || '',
        bundleSkus: product.bundleSkus?.join(', ') || '',
      });
    }
  }, [product]);

  if (error) return <div className="container py-10">Error cargando producto</div>;
  if (isLoading || (!form && !product)) return <div className="container py-10">Cargando...</div>;
  if (!slug) return <div className="container py-10">Slug inválido</div>;
  if (!product) return <div className="container py-10">Producto no encontrado</div>;
  if (!form) return <div className="container py-10">Preparando formulario…</div>;

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((s: any) => ({ ...s, [k]: v }));
  }
  function addImage(url: string) {
    set('images', (form.images ? form.images + ', ' : '') + url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      images: String(form.images).split(',').map((s: string) => s.trim()).filter(Boolean),
      variants: form.variants
        ? [{ name: 'Variante', values: String(form.variants).split(',').map((s: string) => s.trim()).filter(Boolean) }]
        : undefined,
      bundleSkus: String(form.bundleSkus).split(',').map((s: string) => s.trim()).filter(Boolean),
    };

    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) router.push('/admin/products');
    else console.error('Error al guardar', await res.text());
  }

  return (
    <div className="container py-10 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar producto</h1>
        <a className="btn" href="/admin/products">Volver</a>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <input className="input" placeholder="slug" value={form.slug} onChange={e => set('slug', e.target.value)} required />
        <input className="input" placeholder="Nombre" value={form.name} onChange={e => set('name', e.target.value)} required />
        <input className="input" placeholder="Precio MXN" type="number" value={form.price} onChange={e => set('price', e.target.value)} />
        <input className="input" placeholder="Stock" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} />
        <input className="input" placeholder="Categoría" value={form.category} onChange={e => set('category', e.target.value)} />
        <textarea className="input" placeholder="Descripción" value={form.description} onChange={e => set('description', e.target.value)} />
        <label className="text-sm font-medium">Imágenes (URLs separadas por coma)</label>
        <textarea className="input" placeholder="URLs de imágenes" value={form.images} onChange={e => set('images', e.target.value)} />
        <ImageUploader onUploaded={addImage} />
        <input className="input" placeholder="Variantes (coma)" value={form.variants} onChange={e => set('variants', e.target.value)} />
        <input className="input" placeholder="bundleSkus (coma)" value={form.bundleSkus} onChange={e => set('bundleSkus', e.target.value)} />
        <button className="btn-primary">Guardar cambios</button>
      </form>
    </div>
  );
}
