'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function Header() {
    const [isFixed, setIsFixed] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const freeshippingBar = document.getElementById('freeshipping-bar');
            if (freeshippingBar) {
                const freeshippingBarHeight = freeshippingBar.offsetHeight;
                if (window.scrollY > freeshippingBarHeight) {
                    setIsFixed(true);
                } else {
                    setIsFixed(false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <>
            {/* Barra de envío gratuito (debes agregarle un id para que JS la detecte) */}
            <div id="freeshipping-bar" className="w-full bg-blue-500 text-white text-center py-2">
                Envío gratuito en pedidos de +$500
            </div>

            <header className={`z-50 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 ${isFixed ? 'fixed top-0 w-full animate-fadeInDown' : 'sticky top-0'}`}>
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
        </>
    );
}