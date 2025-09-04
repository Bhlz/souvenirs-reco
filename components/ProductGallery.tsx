'use client';

import { useEffect, useRef, useState } from 'react';
import SafeImage from '@/components/SafeImage';

const sanitizeImages = (arr?: string[]) => (arr ?? []).filter((s) => !!s && s.trim() !== '');

export default function ProductGallery({
  images = [],
  name,
  aspect = 'aspect-[4/3]',
}: {
  images?: string[];
  name: string;
  aspect?: string;
}) {
  const imgs = sanitizeImages(images);
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => setIdx(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onResize = () => el.scrollTo({ left: el.clientWidth * idx });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [idx]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(imgs.length - 1, i));
    el.scrollTo({ left: el.clientWidth * clamped, behavior: 'smooth' });
    setIdx(clamped);
  };
  const next = () => goTo(idx + 1);
  const prev = () => goTo(idx - 1);

  return (
    <div className="w-full">
      <div className="relative">
        <div
          ref={trackRef}
          tabIndex={0}
          className={`flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth ${aspect} rounded-3xl border bg-white`}
          style={{ scrollbarWidth: 'none' }}
        >
          {imgs.length > 0 ? (
            imgs.map((src, i) => (
              <div key={i} className={`relative min-w-full snap-center ${aspect}`}>
                <SafeImage
                  src={src}
                  alt={`${name} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={i === 0}
                />
              </div>
            ))
          ) : (
            <div className={`flex min-w-full snap-center items-center justify-center ${aspect} text-xs text-neutral-500`}>
              Sin imagen
            </div>
          )}
        </div>

        {imgs.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow"
            >
              ›
            </button>
          </>
        )}

        {imgs.length > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-1">
            {imgs.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? 'bg-white' : 'bg-white/60'}`} />
            ))}
          </div>
        )}
      </div>

      {imgs.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2 md:grid-cols-8">
          {imgs.map((src, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative aspect-square overflow-hidden rounded-xl border ${i === idx ? 'ring-2 ring-black' : ''}`}
            >
              <SafeImage
                src={src}
                alt={`${name} thumb ${i + 1}`}
                fill
                className="object-cover"
                sizes="150px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
