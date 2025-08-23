'use client';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* Logo con imagen y animación */}
        <Link href="/" className="flex items-center gap-2 font-bold">
          <img 
            src="/logos/LogoSouvenirsGreco.jpg" 
            alt="https://images.icon-icons.com/1487/PNG/512/8389-mastercard_102495.png" 
            className="h-14 w-14 object-contain transition-transform duration-300 hover:scale-50" 
          />
          Souvenirs Greco
        </Link>

        {/* Navegación */}
        <nav className="hidden gap-6 md:flex">
          <a href="#colecciones" className="hover:text-brand transition-colors duration-200">Colecciones</a>
          <a href="#opinion" className="hover:text-brand transition-colors duration-200">Reseñas</a>
          <a href="#faq" className="hover:text-brand transition-colors duration-200">FAQ</a>
        </nav>

        {/* Carrito */}
        <Link href="/cart" className="btn btn-secondary flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5"/>
          Carrito
        </Link>
      </div>
    </header>
  );
}
