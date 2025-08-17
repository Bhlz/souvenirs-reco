'use client';
import Image from 'next/image';

const UGC = [
  { src: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=1200', text: '“Excelente calidad y empaque para regalo.” — Mariana' },
  { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200', text: '“Llegó en 48 horas a CDMX.” — Luis' },
  { src: 'https://images.unsplash.com/photo-1549216963-72c1712c1196?q=80&w=1200', text: '“Talavera auténtica, 10/10.” — Sofía' },
];

export default function ReviewsUGC() {
  return (
    <section id="opinion" className="bg-neutral-50">
      <div className="container py-10 md:py-16">
        <h2 className="section-title">Lo que dicen nuestros clientes</h2>
        <div className="mt-6 flex gap-4 overflow-x-auto scroll-smooth snap-x">
          {UGC.map((item, i) => (
            <figure key={i} className="snap-start min-w-[280px] max-w-sm shrink-0 rounded-3xl bg-white p-3 shadow-soft">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={item.src} alt="Foto de cliente" fill className="object-cover"/>
              </div>
              <figcaption className="p-3 text-sm text-neutral-700">{item.text}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
