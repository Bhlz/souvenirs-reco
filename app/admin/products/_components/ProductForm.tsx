'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PackagePlus, Save, Undo2 } from 'lucide-react';
import ImageListInput from '../../_components/ImageListInput';
import { Product, VariantGroup } from '@/lib/types';
import { toast } from '@/lib/toast';

type Mode = 'create' | 'edit';

type ProductDraft = {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  price: string;
  stock: string;
  images: string[];
  variants: VariantGroup[];
  bundleSkus: string[];
  rating?: string;
  reviews?: string;
  variantPriceMap?: Record<string, number>;
};

const normalizeList = (value?: (string | null | undefined)[]) =>
  (value ?? [])
    .map((u) => (u ?? '').toString().trim())
    .filter(Boolean)
    .filter((u, idx, arr) => arr.indexOf(u) === idx);

const parseVariantKey = (key: string) =>
  key
    .split('|')
    .map((pair) => pair.split(':'))
    .filter((kv) => kv.length === 2) as [string, string][];

const canonicalKeyFromSelection = (groups: VariantGroup[], selection: Record<string, string>) => {
  const ordered = groups
    .map((g) => g.name.trim())
    .filter(Boolean)
    .map((name) => {
      const val = selection[name];
      if (!val) return null;
      return `${name}:${val}`;
    })
    .filter(Boolean) as string[];
  if (ordered.length !== groups.filter((g) => g.name.trim() && g.values?.length).length) return '';
  return ordered.join('|');
};

const cleanVariantPriceMap = (
  map: Record<string, number | string | undefined> | undefined,
  variants: VariantGroup[]
) => {
  const next: Record<string, number> = {};
  if (!map) return next;

  Object.entries(map).forEach(([rawKey, rawPrice]) => {
    const entries = parseVariantKey(rawKey);
    if (entries.length === 0) return;
    const price = Number(rawPrice);
    if (!Number.isFinite(price)) return;

    const selection: Record<string, string> = {};
    for (const [name, val] of entries) selection[name] = val;

    const allGroupsHaveValue = variants
      .filter((g) => g.name.trim() && g.values?.length)
      .every((g) => {
        const name = g.name.trim();
        const val = selection[name];
        if (!val) return false;
        return g.values.includes(val);
      });
    if (!allGroupsHaveValue) return;

    const key = canonicalKeyFromSelection(variants, selection);
    if (!key) return;
    next[key] = price;
  });

  return next;
};

const toDraft = (p?: Product): ProductDraft => ({
  slug: p?.slug ?? '',
  name: p?.name ?? '',
  description: p?.description ?? '',
  category: p?.category ?? '',
  price: p?.price?.toString() ?? '',
  stock: p?.stock?.toString() ?? '',
  images: normalizeList(p?.images),
  variants:
    p?.variants?.map((v) => ({
      name: v.name,
      values: normalizeList(v.values),
    })) ?? [],
  bundleSkus: normalizeList(p?.bundleSkus),
  rating: p?.rating?.toString(),
  reviews: p?.reviews?.toString(),
  variantPriceMap: cleanVariantPriceMap(p?.variantPriceMap, p?.variants ?? []),
});

const toPayload = (draft: ProductDraft): Product => {
  const price = Number(draft.price || 0);
  const stock = draft.stock === '' ? undefined : Number(draft.stock);
  const rating = draft.rating ? Number(draft.rating) : undefined;
  const reviews = draft.reviews ? Number(draft.reviews) : undefined;
  const variants = (draft.variants ?? [])
    .map((v) => ({
      name: v.name.trim(),
      values: normalizeList(v.values),
    }))
    .filter((v) => v.name && v.values.length > 0);

  return {
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    description: draft.description?.trim() || undefined,
    category: draft.category?.trim() || undefined,
    price: Number.isFinite(price) ? price : 0,
    stock: Number.isFinite(stock || 0) ? stock : 0,
    images: normalizeList(draft.images),
    variants: variants.length ? variants : undefined,
    bundleSkus: normalizeList(draft.bundleSkus),
    rating: Number.isFinite(rating || 0) && rating !== undefined ? rating : undefined,
    reviews: Number.isFinite(reviews || 0) && reviews !== undefined ? reviews : undefined,
    variantPriceMap: cleanVariantPriceMap(draft.variantPriceMap, variants),
  };
};

export default function ProductForm({ initialProduct, mode }: { initialProduct?: Product; mode: Mode }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProductDraft>(() => toDraft(initialProduct));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bundleInput, setBundleInput] = useState('');

  useEffect(() => {
    setDraft(toDraft(initialProduct));
  }, [initialProduct?.slug]);

  const isEdit = mode === 'edit';

  const setField = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const onVariantsChange = (next: VariantGroup[]) =>
    setDraft((prev) => ({
      ...prev,
      variants: next,
      variantPriceMap: cleanVariantPriceMap(prev.variantPriceMap, next),
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload(draft);
    if (!payload.slug || !payload.name) {
      setError('Slug y nombre son obligatorios');
      return;
    }
    if (!payload.images.length) {
      setError('Agrega al menos una imagen');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/products', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      let msg = 'No se pudo guardar el producto';
      try {
        const data = await res.json();
        msg = data.error || msg;
      } catch {
        msg = await res.text();
      }
      setError(msg || 'Error desconocido');
      return;
    }

    toast(isEdit ? 'Producto actualizado' : 'Producto creado');
    router.push('/admin/products');
  };

  const addBundleSku = () => {
    if (!bundleInput.trim()) return;
    const next = normalizeList([...draft.bundleSkus, bundleInput]);
    setField('bundleSkus', next);
    setBundleInput('');
  };

  const removeBundleSku = (sku: string) =>
    setField(
      'bundleSkus',
      (draft.bundleSkus || []).filter((item) => item !== sku)
    );

  return (
    <div className="container max-w-5xl pb-12 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Catálogo</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={() => router.push('/admin/products')}>
            <Undo2 className="mr-2 h-4 w-4" />
            Volver
          </button>
          <button
            type="button"
            className="btn bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => router.push('/admin/products/new')}
          >
            <PackagePlus className="mr-2 h-4 w-4" />
            Nuevo
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Datos principales</h2>
              <p className="text-sm text-slate-500">
                Nombre, slug para la URL, categoría y descripción corta.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Slug</label>
              <input
                className="input"
                placeholder="alebrije-oaxaca"
                value={draft.slug}
                onChange={(e) => setField('slug', e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">Usa letras minúsculas, guiones y sin espacios.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nombre</label>
              <input
                className="input"
                placeholder="Alebrije artesanal"
                value={draft.name}
                onChange={(e) => setField('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Categoría</label>
              <input
                className="input"
                placeholder="Artesanías, Textiles..."
                value={draft.category}
                onChange={(e) => setField('category', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Rating (opcional)</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={draft.rating ?? ''}
                  onChange={(e) => setField('rating', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Reseñas (opcional)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={draft.reviews ?? ''}
                  onChange={(e) => setField('reviews', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Historia, materiales y por qué es especial."
              value={draft.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Precio e inventario</h2>
              <p className="text-sm text-slate-500">Define precio base y stock disponible.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Precio MXN</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(e) => setField('price', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Stock</label>
              <input
                className="input"
                type="number"
                min="0"
                value={draft.stock}
                onChange={(e) => setField('stock', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Galería de imágenes</h2>
              <p className="text-sm text-slate-500">
                Sube múltiples imágenes, reordénalas y elimina las que no necesites.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ImageListInput value={draft.images} onChange={(list) => setField('images', list)} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Variantes</h2>
              <p className="text-sm text-slate-500">
                Atributos visibles como talla, color o material. Los precios por variante se mantienen en el
                backend (variantPriceMap).
              </p>
            </div>
          </div>
          <div className="mt-4">
            <VariantGroupsField value={draft.variants} onChange={onVariantsChange} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Precios por variante</h2>
              <p className="text-sm text-slate-500">
                Define overrides de precio por combinación exacta de variantes (ej. Tamaño:Mediano + Color:Rojo).
              </p>
            </div>
          </div>
          <div className="mt-4">
            <VariantPriceMapField
              groups={draft.variants}
              value={draft.variantPriceMap ?? {}}
              onChange={(map) => setField('variantPriceMap', cleanVariantPriceMap(map, draft.variants))}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Bundles / upsell</h2>
              <p className="text-sm text-slate-500">Productos recomendados por slug.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="input flex-1"
                placeholder="slug-del-producto"
                value={bundleInput}
                onChange={(e) => setBundleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBundleSku();
                  }
                }}
              />
              <button
                type="button"
                className="btn bg-slate-900 text-white hover:bg-slate-800"
                onClick={addBundleSku}
              >
                Agregar
              </button>
            </div>
            {draft.bundleSkus.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {draft.bundleSkus.map((sku) => (
                  <span
                    key={sku}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {sku}
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-900"
                      onClick={() => removeBundleSku(sku)}
                      aria-label={`Eliminar ${sku}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary inline-flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Guardar cambios' : 'Publicar producto'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function VariantGroupsField({
  value,
  onChange,
}: {
  value?: VariantGroup[];
  onChange: (v: VariantGroup[]) => void;
}) {
  const groups = useMemo(
    () =>
      (value ?? []).map((g) => ({
        ...g,
        values: normalizeList(g.values),
      })),
    [value]
  );

  const setGroup = (idx: number, patch: Partial<VariantGroup>) =>
    onChange(
      groups.map((g, i) => (i === idx ? { ...g, ...patch } : g)).filter((g) => g.name || g.values.length)
    );

  const addGroup = () => onChange([...groups, { name: 'Variante', values: [] }]);
  const removeGroup = (idx: number) => onChange(groups.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          Agrega atributos como "Tamaño" o "Color" y sus valores separados por coma.
        </div>
      )}

      {groups.map((g, idx) => (
        <div key={`${g.name}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-800">Variante #{idx + 1}</div>
            <button
              type="button"
              className="text-xs text-red-500 underline underline-offset-2"
              onClick={() => removeGroup(idx)}
            >
              Eliminar
            </button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Nombre</label>
              <input
                className="input"
                placeholder="Tamaño, Color..."
                value={g.name}
                onChange={(e) => setGroup(idx, { name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Valores (coma)
              </label>
              <input
                className="input"
                placeholder="Chico, Mediano, Grande"
                value={g.values.join(', ')}
                onChange={(e) =>
                  setGroup(idx, {
                    values: normalizeList(e.target.value.split(',')),
                  })
                }
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        onClick={addGroup}
      >
        Añadir variante
      </button>
    </div>
  );
}

function VariantPriceMapField({
  groups,
  value,
  onChange,
}: {
  groups: VariantGroup[];
  value: Record<string, number>;
  onChange: (map: Record<string, number>) => void;
}) {
  const [priceInput, setPriceInput] = useState('');
  const [selection, setSelection] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    groups.forEach((g) => {
      const name = g.name.trim();
      if (!name || !g.values?.length) return;
      initial[name] = g.values[0];
    });
    setSelection(initial);
  }, [groups]);

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
        Agrega primero al menos una variante para asignar precios específicos.
      </div>
    );
  }

  const handleSelect = (group: string, val: string) =>
    setSelection((s) => ({ ...s, [group]: val }));

  const addOverride = () => {
    const key = canonicalKeyFromSelection(groups, selection);
    const price = Number(priceInput);
    if (!key || !Number.isFinite(price)) return;
    onChange({ ...value, [key]: price });
    setPriceInput('');
  };

  const remove = (key: string) => {
    const copy = { ...value };
    delete copy[key];
    onChange(copy);
  };

  const entries = Object.entries(value);

  const labelsForKey = (key: string) =>
    parseVariantKey(key).map(([name, val]) => (
      <span key={`${key}-${name}-${val}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
        {name}: {val}
      </span>
    ));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        {groups.map((g) => (
          <div key={g.name} className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">{g.name}</label>
            <select
              className="input"
              value={selection[g.name] ?? g.values?.[0] ?? ''}
              onChange={(e) => handleSelect(g.name, e.target.value)}
            >
              {g.values?.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="space-y-2 md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Precio</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="MXN"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            className="btn bg-slate-900 text-white hover:bg-slate-800"
            onClick={addOverride}
          >
            Guardar override
          </button>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {entries.map(([key, price]) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {labelsForKey(key)}
                <span className="text-sm font-semibold text-slate-900">
                  {price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </span>
              </div>
              <button
                type="button"
                className="text-sm text-red-500 underline underline-offset-2"
                onClick={() => remove(key)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          No hay overrides. El precio base será el mismo para todas las variantes.
        </div>
      )}
    </div>
  );
}
