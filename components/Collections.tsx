// components/Collections.tsx
import Image from 'next/image';
import Reveal from '@/components/ui/Reveal';
import { getAllProducts } from '@/lib/store';
import CollectionsGrid from './CollectionsGrid';

const pickCover = (imgs?: string[]) =>
  (imgs ?? []).find((s) => !!s && s.trim() !== '') || '/logos/LogosouvenirsGreco.jpg';

export default async function Collections() {
  const items = await getAllProducts();

  // Sanitiza covers (por si hay strings vacíos)
  const safeItems = items.map((p) => ({
    ...p,
    images: [pickCover(p.images), ...(p.images ?? []).slice(1)],
  }));

  return (
    <section id="productos" className="relative overflow-hidden py-16">
      {/* Fondo: tu archivo en public/uploads/fondo-productos.png */}
      <div className="absolute inset-0 -z-20 bg-[url('/uploads/fondo-productos.png')] bg-cover bg-center bg-no-repeat" />
      {/* Velo para contraste */}
      <div className="absolute inset-0 -z-10 bg-white/70" />

      {/* Orbes sutiles */}
      <div className="pointer-events-none absolute -left-24 top-0 -z-10 h-80 w-80 rounded-full bg-pink-400/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute right-0 bottom-0 -z-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl animate-ping" />

      <div className="container">
        <Reveal>
          <h2 className="section-title">Productos</h2>
          <p className="mt-2 text-neutral-700">
            Elige tu souvenir perfecto, directo del corazón de Guadalajara.
          </p>
          {/* Subrayado con gradiente animado */}
          <div className="mb-6 mt-3 h-[3px] w-28 rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-pink-500 animate-pulse" />
        </Reveal>

        <CollectionsGrid items={safeItems as any} />
      </div>
    </section>
  );
}
