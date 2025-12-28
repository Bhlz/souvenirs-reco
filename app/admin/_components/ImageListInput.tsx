'use client';
import { useMemo, useState } from 'react';
import { MoveDown, MoveUp, Trash2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import SafeImage from '@/components/SafeImage';

type Props = {
  value?: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  helper?: string;
};

const normalizeList = (value: (string | null | undefined)[]) =>
  value
    .map((u) => (u ?? '').trim())
    .filter(Boolean)
    .filter((u, idx, arr) => arr.indexOf(u) === idx);

export default function ImageListInput({ value, onChange, label, helper }: Props) {
  const list = useMemo(() => normalizeList(value ?? []), [value]);
  const [draft, setDraft] = useState('');

  const addUrl = (url: string) => {
    const clean = normalizeList([...list, url]);
    onChange(clean);
    setDraft('');
  };

  const remove = (idx: number) => onChange(list.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const helperText =
    helper || 'Admite URLs directas, archivos locales (subida) y URLs de Cloudinary.';

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-semibold text-slate-900">{label}</label>}

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          className="input flex-1"
          placeholder="https://..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => draft.trim() && addUrl(draft)}
          >
            Añadir URL
          </button>
          <div className="rounded-xl border border-slate-200 px-3 py-2">
            <ImageUploader onUploaded={(url) => addUrl(url)} />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">{helperText}</p>

      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          Aún no hay imágenes. Agrega al menos una para que el producto se muestre en el catálogo y en
          el dashboard.
        </div>
      )}

      {list.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((url, idx) => (
            <div key={url} className="relative overflow-hidden rounded-2xl border bg-white">
              <div className="relative aspect-video w-full">
                <SafeImage src={url} alt={`Imagen ${idx + 1}`} fill className="object-cover" sizes="320px" />
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <div className="w-40 truncate text-xs text-slate-600" title={url}>
                  {url}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                    onClick={() => move(idx, -1)}
                    aria-label="Mover arriba"
                    disabled={idx === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                    onClick={() => move(idx, 1)}
                    aria-label="Mover abajo"
                    disabled={idx === list.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-1 text-red-500 hover:bg-red-50"
                    onClick={() => remove(idx)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
