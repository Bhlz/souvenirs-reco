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
            Souvenirs Greco  <span className="text-accent">Nuestra Historia</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Más que un recuerdo, una experiencia única. ¡Al estilo Jalisco!
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#colecciones" className="btn-primary">Comprar ahora</Link>
            <a href="#story" className="btn">Conoce nuestra historia</a>
          </div>
          <ul className="mt-6 grid grid-cols-3 gap-3 text-sm text-neutral-600">
            <li className="flex items-center gap-2"><Truck className="h-5 w-5 text-brand"/> Envío 24–72h</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand"/> Devoluciones 30 días</li>
            <li className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-brand"/> Tarjetas, MSI, SPEI, OXXO</li>
          </ul>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
          <Image src="https://www.anahuac.mx/mexico/sites/default/files/styles/webp/public/noticias/Compra-de-artesanias-en-Mexico.jpg.webp?itok=PFlrI2YQ" alt="Souvenirs mexicanos" fill priority className="object-cover"/>
        </div>
      </div>
    </section>
  );
}
