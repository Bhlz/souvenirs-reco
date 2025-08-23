'use client';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* Logo con animación */}
        <Link href="/" className="flex items-center gap-2 font-bold transition-all duration-300">
          <img 
            src="/logos/LogoSouvenirsGreco.jpg" 
            alt="Logo Souvenirs Greco" 
            className="h-14 w-14 object-contain transition-transform duration-300 hover:scale-110" 
          />
          <span style={{ color: '#043d3fff' }}>Souvenirs Greco</span>
        </Link>

        {/* Navegación */}
        <nav className="hidden gap-6 md:flex">
          <a href="#colecciones" className="hover:text-brand transition-colors duration-200">Colecciones</a>
          <a href="#opinion" className="hover:text-brand transition-colors duration-200">Reseñas</a>
          <a href="#faq" className="hover:text-brand transition-colors duration-200">FAQ</a>
        </nav>

        {/* Botón del Carrito con animaciones */}
        <Link 
          href="/cart" 
          className="btn btn-secondary flex items-center transition-transform duration-300 hover:scale-110"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          <span className="animate-shake">Carrito</span>
        </Link>
      </div>
    </header>
  );
  // tailwind.config.js
module.exports = {
  // ...
  theme: {
    extend: {
      animation: {
        shake: 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        shake: {
          '10%, 90%': {
            transform: 'translate3d(-1px, 0, 0)',
          },
          '20%, 80%': {
            transform: 'translate3d(2px, 0, 0)',
          },
          '30%, 50%, 70%': {
            transform: 'translate3d(-4px, 0, 0)',
          },
          '40%, 60%': {
            transform: 'translate3d(4px, 0, 0)',
          },
        },
      },
    },
  },
  plugins: [],
};
}