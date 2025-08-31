'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import logo from '@/public/logos/logosouvenirs-greco.jpg'; // ⬅️ import estático

export default function Header() {
  const [isFixed, setIsFixed] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const freeshippingBar = document.getElementById('freeshipping-bar');
      const threshold = freeshippingBar?.offsetHeight ?? 0;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsFixed(window.scrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Invocar una vez por si entras con scroll
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Barra de envío gratuito */}
      <div id="freeshipping-bar" className="w-full bg-blue-500 text-white text-center py-2">
        Envío gratuito en pedidos de +$500
      </div>

      <header
        ref={headerRef}
        className={[
          'z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60',
          isFixed ? 'fixed top-0 w-full animate-fadeInDown shadow-sm' : 'sticky top-0',
        ].join(' ')}
      >
        <div className="container flex h-16 items-center justify-between">
          {/* Logo + marca */}
          <Link href="/" className="flex items-center gap-2 font-bold transition-all duration-300">
            <Image
              src={logo}
              alt="Logo Souvenirs Greco"
              width={56}
              height={56}
              priority
              className="h-14 w-14 object-contain transition-transform duration-300 hover:scale-110"
            />
            <span style={{ color: '#043d3fff' }}>Souvenirs Greco</span>
          </Link>

          {/* Navegación */}
          <nav className="hidden gap-6 md:flex" aria-label="Main">
            <a href="#colecciones" className="hover:text-brand transition-colors duration-200">Colecciones</a>
            <a href="#opinion" className="hover:text-brand transition-colors duration-200">Reseñas</a>
            <a href="#faq" className="hover:text-brand transition-colors duration-200">FAQ</a>
          </nav>

          {/* Carrito */}
          <Link
            href="/cart"
            className="btn btn-secondary flex items-center transition-transform duration-300 hover:scale-110"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            <span className="animate-shake">Carrito</span>
          </Link>
        </div>
      </header>

      {/* Spacer para evitar “salto” cuando el header pasa a fixed */}
      {isFixed && <div aria-hidden className="h-16" />}
    </>
  );
}
