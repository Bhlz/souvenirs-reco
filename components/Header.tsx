'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import logo from '@/public/logos/logosouvenirs-greco.jpg';
import { cartCount } from '@/lib/cart';

export default function Header() {
  const [isFixed, setIsFixed] = useState(false);
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Keyframes para el shake y el pop del badge
  useEffect(() => {
    if ((window as any).__cart_keyframes) return;
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes cart-shake {
        0% { transform: scale(1) rotate(0deg); }
        15% { transform: scale(1.05) rotate(-8deg); }
        30% { transform: scale(1.05) rotate(8deg); }
        45% { transform: scale(1.05) rotate(-6deg); }
        60% { transform: scale(1.05) rotate(6deg); }
        75% { transform: scale(1.02) rotate(-2deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      @keyframes badge-pop {
        0% { transform: scale(0.8); opacity: 0.5; }
        60% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    (window as any).__cart_keyframes = true;
  }, []);

  // Sticky/fixed header según scroll
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
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Badge + shake: suscripciones a eventos del carrito
  useEffect(() => {
    const update = (n?: number) => setCount(typeof n === 'number' ? n : cartCount());
    update(); // inicial

    const onChanged = (e: Event) => {
      const d = (e as CustomEvent).detail as { count?: number } | undefined;
      update(d?.count);
      // anima el badge al cambiar
      const el = document.getElementById('cart-badge');
      if (el) {
        el.style.animation = 'none';
        // reflow para reiniciar animación
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetHeight;
        el.style.animation = 'badge-pop 300ms ease';
        setTimeout(() => { el.style.animation = ''; }, 300);
      }
    };
    const onStorage = () => update();
    const onBump = () => {
      setBump(true);
      setTimeout(() => setBump(false), 650);
    };

    window.addEventListener('cart:changed', onChanged as any);
    window.addEventListener('storage', onStorage);
    window.addEventListener('cart:bump', onBump);

    return () => {
      window.removeEventListener('cart:changed', onChanged as any);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cart:bump', onBump);
    };
  }, []);

  // Límite visual 99+
  const badgeText = count > 99 ? '99+' : String(count);

  return (
    <>
      {/* Barra de envío gratuito */}
      <div id="freeshipping-bar" className="w-full bg-blue-500 py-2 text-center text-white">
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
            <a href="#colecciones" className="transition-colors duration-200 hover:text-brand">Colecciones</a>
            <a href="#opinion" className="transition-colors duration-200 hover:text-brand">Reseñas</a>
            <a href="#faq" className="transition-colors duration-200 hover:text-brand">FAQ</a>
          </nav>

          {/* Carrito con badge y vibración */}
        <Link
  href="/cart"
  aria-label="Ir al carrito"
  className="relative inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow"
  style={{ animation: bump ? 'cart-shake 650ms ease' : undefined }}
  title="Carrito"
>
  <ShoppingCart className="h-5 w-5" />
  <span>Carrito</span>
  {count > 0 && (
    <span
      id="cart-badge"
      className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-pink-600 px-1 text-center text-[11px] font-bold leading-[18px] text-white shadow ring-2 ring-white"
      style={{ height: 18 }}
    >
      {badgeText}
    </span>
  )}
</Link>

        </div>
      </header>

      {/* Spacer para evitar “salto” cuando el header pasa a fixed */}
      {isFixed && <div aria-hidden className="h-16" />}
    </>
  );
}
