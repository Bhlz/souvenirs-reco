'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';
import bg from '@/public/logos/portadasouvenirsgreco.jpg';

export default function Hero() {
  // Scroll suave con offset por el header + barra de free shipping
  const goTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    const header = document.querySelector('header') as HTMLElement | null;
    const free = document.getElementById('freeshipping-bar') as HTMLElement | null;
    const offset = (header?.offsetHeight || 0) + (free?.offsetHeight || 0) + 8;
    const y = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`); // actualiza el hash sin salto
  };

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bg}
          alt="Souvenirs mexicanos de fondo"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Contenido */}
      <div className="container relative z-10 flex h-full items-center justify-center">
        <div className="rounded-md bg-white/80 p-6 text-center backdrop-blur-sm">
          <div className="badge mx-auto mb-4">Hecho en México</div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <span style={{ color: '#043d3fff' }}>Souvenirs Greco</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Más que un recuerdo, una experiencia única. ¡Al estilo Jalisco!.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/catalogo"
              className="btn-primary transition-transform duration-300 hover:scale-105"
            >
              Comprar ahora
            </Link>

            <a
              href="#story"
              onClick={goTo('story')}
              className="btn transition-transform duration-300 hover:scale-105"
            >
              Conoce nuestra historia
            </a>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-neutral-600 md:grid-cols-3">
            <li className="flex flex-col items-center gap-2">
              <Truck className="h-5 w-5 text-brand" /> Envío 24–72h
            </li>
            <li className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" /> Calidad Garantizada
            </li>
            <li className="flex flex-col items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand" /> Tarjetas, MSI, SPEI, OXXO
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
