'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative">
      <div className="container grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
        <div>
          <div className="badge mb-4">Hecho en México</div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <span style={{ color: '#043d3fff' }}>Souvenirs Greco</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Más que un recuerdo, una experiencia única. ¡Al estilo Jalisco!.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {/* Botón de Comprar ahora con efecto de aumento */}
            <Link 
              href="#colecciones" 
              className="btn-primary transition-transform duration-300 hover:scale-125"
            >
              Comprar ahora
            </Link>
            {/* Botón de Conoce nuestra historia con efecto de aumento */}
            <a 
              href="#story" 
              className="btn transition-transform duration-300 hover:scale-125"
            >
              Conoce nuestra historia
            </a>
          </div>
          <ul className="mt-6 grid grid-cols-3 gap-3 text-sm text-neutral-600">
            <li className="flex items-center gap-2"><Truck className="h-5 w-5 text-brand"/> Envío 24–72h</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand"/> Devoluciones 30 días</li>
            <li className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-brand"/> Tarjetas, MSI, SPEI, OXXO</li>
          </ul>
        </div>
        <div className="relative aspect-[16/16] overflow-hidden rounded-3x3">
          <Image 
            src="/logos/Portadasouvenirsgreco.jpg" 
            alt="Souvenirs mexicanos" 
            fill 
            priority 
            className="object-contain" 
          />
        </div>
      </div>
    </section>
  );
}