'use client';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ImageUploader from '@/components/ImageUploader';

const fetcher = (url: string) => fetch(url).then(r=>r.json());

export default function EditProduct() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data } = useSWR('/api/admin/products', fetcher);
  const product = (data?.products || []).find((p: any) => p.slug === params.slug);

  const [form, setForm] = useState<any>(null);
  useEffect(()=>{
    if (product) {
      setForm({
        ...product,
        images: product.images?.join(', ') || '',
        variants: product.variants?.[0]?.values?.join(', ') || '',
        bundleSkus: product.bundleSkus?.join(', ') || '',
      });
    }
  }, [product]);

  if (!form) return <div className="container py-10">Cargando...</div>;

  function set<K extends keyof typeof form>(k: K, v: any) { setForm((s: any) => ({...s, [k]: v})); }
  function addImage(url: string) { set('images', (form.images ? form.images + ', ' : '') + url); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      images: form.images.split(',').map((s:string)=>s.trim()).filter(Boolean),
      variants: form.variants ? [{ name: 'Variante', values: form.variants.split(',').map((s:string)=>s.trim()) }] : undefined,
      bundleSkus: form.bundleSkus.split(',').map((s:string)=>s.trim()).filter(Boolean),
    };
    const res = await fetch('/api/admin/products', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (res.ok) router.push('/admin/products');
    else alert('Error al guardar');
  }

  return (
    <div className="container py-10 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar producto</h1>
        <a className="btn" href="/admin/products">Volver</a>
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <input className="input" placeholder="slug" value={form.slug} onChange={e=>set('slug', e.target.value)} required />
        <input className="input" placeholder="Nombre" value={form.name} onChange={e=>set('name', e.target.value)} required />
        <input className="input" placeholder="Precio MXN" type="number" value={form.price} onChange={e=>set('price', e.target.value)} />
        <input className="input" placeholder="Stock" type="number" value={form.stock} onChange={e=>set('stock', e.target.value)} />
        <input className="input" placeholder="Categoría" value={form.category} onChange={e=>set('category', e.target.value)} />
        <textarea className="input" placeholder="Descripción" value={form.description} onChange={e=>set('description', e.target.value)} />
        <label className="text-sm font-medium">Imágenes (URLs separadas por coma)</label>
        <textarea className="input" placeholder="URLs de imágenes" value={form.images} onChange={e=>set('images', e.target.value)} />
        <ImageUploader onUploaded={addImage} />
        <input className="input" placeholder="Variantes (coma)" value={form.variants} onChange={e=>set('variants', e.target.value)} />
        <input className="input" placeholder="bundleSkus (coma)" value={form.bundleSkus} onChange={e=>set('bundleSkus', e.target.value)} />
        <button className="btn-primary">Guardar cambios</button>
      </form>
    </div>
  );
}
