'use client';

import Link from 'next/link';

const ADDRESS_TEXT = 'Mercado Libertad (San Juan de Dios), Locales 134 y 135, 44360 Guadalajara, Jal.';
const MAP_Q = encodeURIComponent('Mercado Libertad San Juan de Dios Local 134 y 135, Guadalajara');
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${MAP_Q}&output=embed`;
const MAP_DIRS = `https://www.google.com/maps/dir/?api=1&destination=${MAP_Q}`;

export default function LocationSection() {
  return (
    <section id="ubicacion" className="relative overflow-hidden py-14">
      <div className="absolute inset-0 -z-10 bg-[url('/uploads/fondo-productos.png')] bg-cover bg-center opacity-10" />
      <div className="container">
        <h2 className="section-title">Ubicación</h2>
        <p className="mt-2 max-w-3xl text-neutral-700">
          {ADDRESS_TEXT}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[2fr_1fr]">
          {/* Mapa embebido */}
          <div className="overflow-hidden rounded-2xl border bg-white shadow">
            <iframe
              title="Mapa Souvenirs Greco"
              src={MAP_EMBED_SRC}
              className="h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Tarjeta con CTA */}
          <div className="card h-max space-y-3">
            <div className="text-sm text-neutral-600">¿Cómo llegar?</div>
            <div className="font-semibold">{ADDRESS_TEXT}</div>
            <Link href={MAP_DIRS} target="_blank" className="btn-primary w-full">
              Abrir en Google Maps
            </Link>
            <div className="text-xs text-neutral-500">Se abrirá la app de Google Maps con la ruta hacia el local.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
