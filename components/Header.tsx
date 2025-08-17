'use client';
import Link from 'next/link';
import { ShoppingCart, Gift } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Gift className="h-6 w-6 text-accent" /> SouvenirsMX
        </Link>
        <nav className="hidden gap-6 md:flex">
          <a href="#colecciones" className="hover:text-brand">Colecciones</a>
          <a href="#opinion" className="hover:text-brand">Reseñas</a>
          <a href="#faq" className="hover:text-brand">FAQ</a>
        </nav>
        <Link href="/cart" className="btn btn-secondary"><ShoppingCart className="mr-2 h-5 w-5"/>Carrito</Link>
      </div>
    </header>
  );
}
