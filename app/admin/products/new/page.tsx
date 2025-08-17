'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';

export default function NewProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: '', name: '', price: 0, images: '', rating: 5, reviews: 0,
    category: '', description: '', stock: 0, variants: '', bundleSkus: ''
  });
  function set<K extends keyof typeof form>(k: K, v: any) { setForm(s => ({...s, [k]: v})); }
  function addImage(url: string) { set('images', (form.images ? form.images + ', ' : '') + url); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      images: form.images.split(',').map(s=>s.trim()).filter(Boolean),
      variants: form.variants ? [{ name: 'Variante', values: form.variants.split(',').map(s=>s.trim()) }] : undefined,
      bundleSkus: form.bundleSkus.split(',').map(s=>s.trim()).filter(Boolean),
    };
    const res = await fetch('/api/admin/products', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (res.ok) router.push('/admin/products');
    else alert('Error al guardar');
  }

  return (
    <div className="container py-10 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nuevo producto</h1>
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
        <input className="input" placeholder="Variantes (valores separados por coma)" value={form.variants} onChange={e=>set('variants', e.target.value)} />
        <input className="input" placeholder="bundleSkus (slugs separados por coma)" value={form.bundleSkus} onChange={e=>set('bundleSkus', e.target.value)} />
        <button className="btn-primary">Guardar</button>
      </form>
    </div>
  );
}
