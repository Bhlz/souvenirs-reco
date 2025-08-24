'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Truck, CreditCard } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">
      {/* Contenedor de la imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/logos/Portadasouvenirsgreco.jpg" 
          alt="Souvenirs mexicanos de fondo" 
          fill 
          priority 
          className="object-cover" 
        />
      </div>

      {/* ESTE ES EL CONTENEDOR PRINCIPAL QUE DEBES MODIFICAR.
        
        Las clases 'justify-center' y 'items-center' controlan la posición del contenido.
        - 'justify-center' mueve los elementos HORIZONTALMENTE.
        - 'items-center' mueve los elementos VERTICALMENTE.
      */}
      <div className="container relative z-10 flex h-full items-center justify-center">
        {/*
          Para mover el contenido:
          - A la IZQUIERDA: cambia 'justify-center' por 'justify-start'.
          - A la DERECHA: cambia 'justify-center' por 'justify-end'.
          
          - ARRIBA: cambia 'items-center' por 'items-start'.
          - ABAJO: cambia 'items-center' por 'items-end'.
          
          También puedes usar 'justify-between', 'justify-around', etc.
        */}
        
        {/* Contenedor del texto, botones y beneficios */}
        <div className="bg-white/80 p-6 rounded-md backdrop-blur-sm text-center">
          <div className="badge mb-4 mx-auto">Hecho en México</div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            <span style={{ color: '#043d3fff' }}>Souvenirs Greco</span>
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Más que un recuerdo, una experiencia única. ¡Al estilo Jalisco!.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link 
              href="#colecciones" 
              className="btn-primary transition-transform duration-300 hover:scale-105"
            >
              Comprar ahora
            </Link>
            <a 
              href="#story" 
              className="btn transition-transform duration-300 hover:scale-105"
            >
              Conoce nuestra historia
            </a>
          </div>
          <ul className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-neutral-600">
            <li className="flex flex-col items-center gap-2"><Truck className="h-5 w-5 text-brand"/> Envío 24–72h</li>
            <li className="flex flex-col items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand"/> Devoluciones 30 días</li>
            <li className="flex flex-col items-center gap-2"><CreditCard className="h-5 w-5 text-brand"/> Tarjetas, MSI, SPEI, OXXO</li>
          </ul>
        </div>
      </div>
    </section>
  );
}