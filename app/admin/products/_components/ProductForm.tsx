'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Loader2, PackagePlus, Save, Undo2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import ImageListInput from '../../_components/ImageListInput';
import { Product, VariantGroup } from '@/lib/types';
import { toast } from '@/lib/toast';

// Genera un slug desde el nombre
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Remover guiones al inicio/final
};

// Tipo para el estado de validación
type ValidationState = {
  isValid: boolean;
  message?: string;
};

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
  const [autoSlug, setAutoSlug] = useState(mode === 'create'); // Auto-sync slug with name
  const [attemptedSubmit, setAttemptedSubmit] = useState(false); // Track if user tried to submit
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [pricesOpen, setPricesOpen] = useState(false);
  const [bundlesOpen, setBundlesOpen] = useState(false);

  useEffect(() => {
    setDraft(toDraft(initialProduct));
    setAutoSlug(mode === 'create');
  }, [initialProduct?.slug, mode]);

  const isEdit = mode === 'edit';

  // Progress calculation
  const progress = useMemo(() => {
    const checks = {
      hasName: draft.name.trim().length > 0,
      hasSlug: draft.slug.trim().length > 0,
      hasPrice: Number(draft.price) > 0,
      hasImage: draft.images.length > 0,
    };
    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const percent = Math.round((completed / total) * 100);

    const missing: string[] = [];
    if (!checks.hasName) missing.push('nombre');
    if (!checks.hasSlug) missing.push('slug');
    if (!checks.hasPrice) missing.push('precio');
    if (!checks.hasImage) missing.push('imagen');

    return { percent, completed, total, missing, isComplete: completed === total };
  }, [draft.name, draft.slug, draft.price, draft.images]);

  const setField = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  // Handle name change with auto-slug
  const handleNameChange = (name: string) => {
    setField('name', name);
    if (autoSlug) {
      setField('slug', generateSlug(name));
    }
  };

  // Handle slug change (disable auto if manually edited)
  const handleSlugChange = (slug: string) => {
    setField('slug', slug);
    if (autoSlug && slug !== generateSlug(draft.name)) {
      setAutoSlug(false);
    }
  };

  // Re-enable auto-slug
  const enableAutoSlug = () => {
    setAutoSlug(true);
    setField('slug', generateSlug(draft.name));
  };

  const onVariantsChange = (next: VariantGroup[]) =>
    setDraft((prev) => ({
      ...prev,
      variants: next,
      variantPriceMap: cleanVariantPriceMap(prev.variantPriceMap, next),
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true); // Trigger validation highlighting

    const payload = toPayload(draft);
    if (!payload.slug || !payload.name) {
      setError('Completa nombre y slug antes de continuar');
      return;
    }
    if (Number(payload.price) <= 0) {
      setError('Agrega un precio válido');
      return;
    }
    if (!payload.images.length) {
      setError('Agrega al menos una imagen del producto');
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
          {isEdit && (
            <button
              type="button"
              className="btn bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => router.push('/admin/products/new')}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {progress.isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-amber-500" />
            )}
            <span className="text-sm font-semibold text-slate-900">
              {progress.isComplete ? '¡Listo para publicar!' : `${progress.percent}% completado`}
            </span>
          </div>
          {!progress.isComplete && (
            <span className="text-xs text-slate-500">
              Falta: {progress.missing.join(', ')}
            </span>
          )}
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progress.isComplete
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
              : 'bg-gradient-to-r from-amber-400 to-amber-500'
              }`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Datos principales</h2>
              <p className="text-sm text-slate-500">
                Nombre del producto, URL amigable, categoría y descripción.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* NOMBRE - Goes first */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
                <span className="field-required">Nombre del producto</span>
                {draft.name && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </label>
              <input
                className={`input ${attemptedSubmit && !draft.name ? 'ring-2 ring-red-300' : ''}`}
                placeholder="Ej: Alebrije artesanal Oaxaqueño"
                value={draft.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">Nombre visible en la tienda y catálogo.</p>
            </div>

            {/* SLUG - Goes second, auto-generated */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
                <span className="field-required">Slug (URL)</span>
                <span className="tooltip-trigger">
                  ?
                  <span className="tooltip-content">
                    Identificador único para la URL. Ejemplo: /product/alebrije-oaxaca
                  </span>
                </span>
                {autoSlug && (
                  <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    Auto
                  </span>
                )}
                {draft.slug && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </label>
              <div className="flex gap-2">
                <input
                  className={`input flex-1 ${attemptedSubmit && !draft.slug ? 'ring-2 ring-red-300' : ''}`}
                  placeholder="alebrije-oaxaca"
                  value={draft.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                />
                {!autoSlug && (
                  <button
                    type="button"
                    className="btn text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                    onClick={enableAutoSlug}
                    title="Regenerar desde nombre"
                  >
                    Auto
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {autoSlug ? 'Se genera automáticamente del nombre' : 'Editando manualmente'}
              </p>
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
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="field-optional">Rating</span>
                  <span className="tooltip-trigger">
                    ?
                    <span className="tooltip-content">
                      Calificación promedio del producto (0-5 estrellas). Se mostrará en la tienda. Déjalo vacío si aún no tienes reseñas.
                    </span>
                  </span>
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="4.5"
                  value={draft.rating ?? ''}
                  onChange={(e) => setField('rating', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="field-optional">Reseñas</span>
                  <span className="tooltip-trigger">
                    ?
                    <span className="tooltip-content">
                      Número total de reseñas/opiniones del producto. Se muestra junto al rating.
                    </span>
                  </span>
                </label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="0"
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
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                Precio e inventario
                {Number(draft.price) > 0 && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </h2>
              <p className="text-sm text-slate-500">Define el precio de venta y las unidades disponibles.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
                <span className="field-required">Precio de venta</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">$</span>
                <input
                  className={`input pl-8 ${attemptedSubmit && !Number(draft.price) ? 'ring-2 ring-red-300' : ''}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={draft.price}
                  onChange={(e) => setField('price', e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">MXN</span>
              </div>
              <p className="text-xs text-slate-500">Precio visible al cliente en la tienda.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 field-optional">Stock disponible</label>
              <div className="relative">
                <input
                  className="input pr-16"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={draft.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">unidades</span>
              </div>
              <p className="text-xs text-slate-500">Cantidad en inventario. Déjalo vacío si es ilimitado.</p>
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

        {/* VARIANTES CON PRECIOS INTEGRADOS */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors"
            onClick={() => setVariantsOpen(!variantsOpen)}
          >
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                Variantes y precios
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">Opcional</span>
                {draft.variants.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {draft.variants.reduce((sum, g) => sum + g.values.length, 0)} opciones
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-500">
                ¿Tallas, colores o materiales? Agrega cada opción con su precio.
              </p>
            </div>
            {variantsOpen ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>
          {variantsOpen && (
            <div className="border-t border-slate-100 p-5">
              <SimpleVariantEditor
                variants={draft.variants}
                priceMap={draft.variantPriceMap ?? {}}
                basePrice={draft.price}
                onVariantsChange={onVariantsChange}
                onPriceMapChange={(map) => setField('variantPriceMap', map)}
              />
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                Productos relacionados
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600">Upsell</span>
              </h2>
              <p className="text-sm text-slate-500">
                ¿Qué otros productos podrían interesarle al cliente? Agrega los slugs de productos complementarios para aumentar ventas.
              </p>
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
    </div >
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
        Añadir grupo de variantes
      </button>
    </div>
  );
}

// Nuevo componente simplificado para variantes con precios integrados
function SimpleVariantEditor({
  variants,
  priceMap,
  basePrice,
  onVariantsChange,
  onPriceMapChange,
}: {
  variants: VariantGroup[];
  priceMap: Record<string, number>;
  basePrice: string;
  onVariantsChange: (v: VariantGroup[]) => void;
  onPriceMapChange: (map: Record<string, number>) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Flatten all variant options for display
  const allOptions = useMemo(() => {
    const result: { group: string; value: string; key: string }[] = [];
    variants.forEach(g => {
      const groupName = g.name.trim();
      if (!groupName) return;
      g.values.forEach(v => {
        const key = `${groupName}:${v}`;
        result.push({ group: groupName, value: v, key });
      });
    });
    return result;
  }, [variants]);

  const addOption = () => {
    const group = newName.trim();
    const value = newValue.trim();
    const price = Number(newPrice);

    if (!group || !value) return;

    // Find or create the group
    const existingIdx = variants.findIndex(g => g.name.trim() === group);
    let newVariants = [...variants];

    if (existingIdx >= 0) {
      // Add value to existing group
      const existing = newVariants[existingIdx];
      if (!existing.values.includes(value)) {
        newVariants[existingIdx] = {
          ...existing,
          values: [...existing.values, value]
        };
      }
    } else {
      // Create new group
      newVariants.push({ name: group, values: [value] });
    }

    onVariantsChange(newVariants);

    // Set price if provided
    if (Number.isFinite(price) && price > 0) {
      const key = `${group}:${value}`;
      onPriceMapChange({ ...priceMap, [key]: price });
    }

    // Reset inputs
    setNewValue('');
    setNewPrice('');
  };

  const removeOption = (groupName: string, value: string) => {
    const newVariants = variants.map(g => {
      if (g.name.trim() === groupName) {
        return { ...g, values: g.values.filter(v => v !== value) };
      }
      return g;
    }).filter(g => g.values.length > 0);

    onVariantsChange(newVariants);

    // Remove from price map
    const key = `${groupName}:${value}`;
    const { [key]: _, ...rest } = priceMap;
    onPriceMapChange(rest);
  };

  const updatePrice = (key: string, price: number) => {
    if (Number.isFinite(price) && price > 0) {
      onPriceMapChange({ ...priceMap, [key]: price });
    } else {
      const { [key]: _, ...rest } = priceMap;
      onPriceMapChange(rest);
    }
  };

  const base = Number(basePrice) || 0;

  return (
    <div className="space-y-4">
      {/* Lista de opciones existentes */}
      {allOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Opciones configuradas
          </p>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {allOptions.map(({ group, value, key }) => (
              <div key={key} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {group}
                  </span>
                  <span className="ml-2 font-medium text-slate-900">{value}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={base.toString()}
                    className="input w-24 text-right text-sm"
                    value={priceMap[key] ?? ''}
                    onChange={(e) => updatePrice(key, Number(e.target.value))}
                  />
                  <span className="text-xs text-slate-400">
                    {priceMap[key] ? '' : '(base)'}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeOption(group, value)}
                  aria-label="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agregar nueva opción */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Agregar opción de variante</p>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Tipo</label>
            <input
              className="input"
              placeholder="Tamaño, Color..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              list="variant-types"
            />
            <datalist id="variant-types">
              {variants.map(g => (
                <option key={g.name} value={g.name} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Valor</label>
            <input
              className="input"
              placeholder="Grande, Rojo..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Precio</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input pl-7"
                placeholder={base.toString() || "0.00"}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn bg-slate-900 text-white hover:bg-slate-800 w-full"
              onClick={addOption}
              disabled={!newName.trim() || !newValue.trim()}
            >
              Agregar
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Ej: Tipo "Tamaño", Valor "Grande", Precio $150
        </p>
      </div>

      {allOptions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
          No hay variantes. Agrega opciones como "Tamaño Grande - $150" para que el cliente pueda elegir.
        </div>
      )}
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
