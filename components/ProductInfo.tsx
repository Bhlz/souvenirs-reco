'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';
import { toast } from '@/lib/toast';
import type { Product } from '@/lib/types';

type Props = { p: Product };

export default function ProductInfo({ p }: Props) {
  const variantGroups = p.variants ?? [];
  const variantPriceMap = p.variantPriceMap ?? {};

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const defaults: Record<string, string> = {};
    variantGroups.forEach((g) => {
      if (g.name && g.values?.length) defaults[g.name] = g.values[0];
    });
    setSelected(defaults);
  }, [p.slug, variantGroups]);

  const price = useMemo(() => {
    if (!variantGroups.length || Object.keys(variantPriceMap).length === 0) return p.price;

    const groupsWithValue = variantGroups.filter((g) => selected[g.name]);
    const allSelected =
      groupsWithValue.length === variantGroups.filter((g) => g.values?.length).length;

    if (allSelected) {
      const fullKey = variantGroups
        .map((g) => `${g.name}:${selected[g.name]}`)
        .join('|');
      if (variantPriceMap[fullKey] != null) return variantPriceMap[fullKey];
    }

    for (const g of groupsWithValue) {
      const key = `${g.name}:${selected[g.name]}`;
      if (variantPriceMap[key] != null) return variantPriceMap[key];
    }

    return p.price;
  }, [p.price, selected, variantGroups, variantPriceMap]);

  const pick = (group: string, value: string) =>
    setSelected((s) => ({ ...s, [group]: value }));

  const onAdd = () => {
    // si tu lib/cart soporta options (recomendado), pasa selected como 3er arg
    (addToCart as any)(p.slug, qty, selected);
    toast('Agregado al carrito');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">{p.name}</h1>
      {typeof p.rating === 'number' && (
        <div className="mt-2 text-neutral-600">
          {p.rating} ★ {p.reviews ? `(${p.reviews} reseñas)` : null}
        </div>
      )}
      <div className="mt-3 text-2xl font-bold">
        {price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        Aceptamos tarjetas, MSI en campañas, SPEI, OXXO Pay y PayPal.
      </div>

      {/* Variantes */}
      {p.variants?.map((v) => (
        <div key={v.name} className="mt-4">
          <div className="text-sm font-medium">{v.name}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {v.values.map((val) => {
              const active = selected[v.name] === val;
              return (
                <button
                  key={val}
                  onClick={() => pick(v.name, val)}
                  className={`rounded-xl border px-3 py-2 text-sm hover:border-brand ${
                    active ? 'border-brand ring-2 ring-brand/30' : ''
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Cantidad */}
      <div className="mt-5 flex items-center gap-3">
        <div className="inline-flex items-center rounded-xl border">
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            −
          </button>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-14 border-l border-r py-2 text-center outline-none"
          />
          <button className="px-3 py-2" onClick={() => setQty((q) => q + 1)}>
            +
          </button>
        </div>

        <button className="btn-primary" onClick={onAdd}>
          Añadir al carrito
        </button>
        <Link href="/catalogo" className="btn">Seguir comprando</Link>
      </div>

      <div className="mt-6 space-y-2 text-sm text-neutral-700">
        <div>
          <strong>Envío:</strong> 24–72h (estimado por CP al  pagar)
        </div>
        <div>
          <strong>Devoluciones:</strong> 30 días sin complicaciones
        </div>
        {p.description && (
          <div>
            <strong>Descripción:</strong> {p.description}
          </div>
        )}
      </div>
    </div>
  );
}
