'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const UGC = [
  // Reviews iniciales
  { src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200', text: '"Siempre que voy a San Juan de Dios paso por aquí. Tienen de todo y siempre encuentro algo nuevo. La atención es súper amable." — Laura M. (Guadalajara)' },
  { src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1200', text: '"Pedí unos recuerdos para una boda y llegaron antes de lo esperado. Todo muy bien empacado y de excelente calidad. Muy recomendado." — Daniel H. (Puebla)' },
  { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200', text: '"Vivo en Estados Unidos y extraño México. Pedí unos souvenirs y fue como traer un pedacito de Guadalajara a casa. Llegaron en perfecto estado." — Sofía C. (Texas, USA)' },
  { src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200', text: '"Me encantaron los sombreritos charros miniatura 😍 Están súper bien hechos y se nota que son artesanales. Ideal para regalar." — Andrea P. (CDMX)' },
  { src: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=1200', text: '"Muy buena atención, me resolvieron todas mis dudas antes de comprar. El envío fue rápido y todo llegó en excelentes condiciones." — Carlos R. (Monterrey)' },

  // Nuevos reviews adicionales
  { src: 'https://images.unsplash.com/photo-1529626455734-5e30dedeaf41?q=80&w=1200', text: '"Pedí varios souvenirs para mi familia en Estados Unidos y todo llegó impecable. Se nota que cuidan cada detalle en el empaque." — Patricia V. (Tijuana)' },
  { src: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200', text: '"Muy buena calidad y variedad. Encontré piezas que no había visto en ningún otro lado del mercado." — Héctor L. (León)' },
  { src: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=1200', text: '"Soy española y me enamoré de la cultura mexicana en mi viaje. Compré en línea y recibí todo en perfecto estado, me hizo recordar Guadalajara." — Isabel R. (Madrid, España)' },
  { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200', text: '"Excelente lugar, siempre lleno de color y con atención muy amable. Es imposible salir sin comprar algo." — Raúl G. (Guadalajara)' },
  { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200', text: '"Encargué souvenirs para un evento empresarial y quedaron encantados. Todo con un toque muy mexicano y original." — Claudia M. (Veracruz)' },
  { src: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1200', text: '"Los productos me llegaron rápido y en excelente estado. Ahora cada que extraño México, entro a su página y compro algo." — Miguel A. (Chicago, USA)' },
  { src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1200', text: '"Me encantan sus miniaturas y artesanías. Perfectas para regalos, siempre sorprenden a quien se las doy." — Karina S. (Guadalajara)' },
];

export default function ReviewsUGC() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const sectionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(null);

  // Intersection Observer para detectar cuando la sección es visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(entries[0].isIntersecting),
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll automático cuando la sección es visible
  useEffect(() => {
    if (isVisible && isAutoScrolling && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 300;
      let currentPosition = 0;

      const autoScroll = () => {
        currentPosition += cardWidth;
        if (currentPosition >= container.scrollWidth - container.clientWidth) {
          currentPosition = 0;
        }
        container.scrollTo({ left: currentPosition, behavior: 'smooth' });
      };

      autoScrollRef.current = setInterval(autoScroll, 3000);
      return () => clearInterval(autoScrollRef.current);
    }
  }, [isVisible, isAutoScrolling]);

  // Pausar auto-scroll cuando el usuario interactúa
  const handleMouseEnter = () => {
    setIsAutoScrolling(false);
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
  };
  const handleMouseLeave = () => {
    setTimeout(() => setIsAutoScrolling(true), 2000);
  };

  const handleCardHover = (index) => setHoveredCard(index);
  const handleCardLeave = () => setHoveredCard(null);

  // Centrar card al hacer click
  const handleCardClick = (index) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const card = container.children[index];
    if (!card) return;

    const containerWidth = container.clientWidth;
    const cardWidth = card.offsetWidth;
    const cardLeft = card.offsetLeft;

    let targetPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);

    // Limitar para que no se corte la última card
    targetPosition = Math.max(0, Math.min(targetPosition, container.scrollWidth - containerWidth));

    container.scrollTo({ left: targetPosition, behavior: 'smooth' });

    setIsAutoScrolling(false);
    setTimeout(() => setIsAutoScrolling(true), 5000);
  };

  return (
    <section 
      ref={sectionRef} 
      id="opinion" 
      className="relative overflow-hidden"
    >
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <Image
          src="uploads/Imagen de WhatsApp 2025-08-31 a las 01.40.00_1eb0c26f.jpg"
          alt="Fondo decorativo mexicano"
          fill
          className="object-cover object-center"
          priority={false}
        />
        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/95 via-neutral-50/90 to-neutral-50/95 backdrop-blur-[0.5px]" />
        {/* Patrón decorativo sutil */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10">
        <div className="container py-10 md:py-16">
          <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="section-title relative text-neutral-800">
              Lo que dicen nuestros clientes
              <div
                className="absolute -bottom-2 left-1/2 h-1 bg-gradient-to-r from-[#043d3f] to-teal-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: isVisible ? '80px' : '0px', transform: 'translateX(-50%)' }}
              />
            </h2>
          </div>

          <div
            ref={scrollContainerRef}
            className="mt-8 flex gap-4 overflow-x-auto scroll-smooth snap-x scrollbar-hide pb-4"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {UGC.map((item, i) => (
              <figure
                key={i}
                className={`snap-start min-w-[280px] max-w-sm shrink-0 rounded-3xl bg-white/95 backdrop-blur-sm shadow-soft border border-white/50 transition-all duration-500 ease-out cursor-pointer group relative
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
                  ${hoveredCard === i ? 'scale-105 shadow-2xl rotate-1 bg-white' : hoveredCard !== null && hoveredCard !== i ? 'scale-95 opacity-70' : 'hover:scale-102 hover:shadow-lg hover:bg-white'}
                `}
                style={{ transitionDelay: isVisible ? `${i * 100}ms` : '0ms' }}
                onMouseEnter={() => handleCardHover(i)}
                onMouseLeave={handleCardLeave}
                onClick={() => handleCardClick(i)}
              >
                {/* Efecto de brillo en el borde */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl">
                  <Image
                    src={item.src}
                    alt="Foto de cliente"
                    fill
                    className={`object-cover transition-all duration-700 ease-out ${hoveredCard === i ? 'scale-110 brightness-110' : 'group-hover:scale-105'}`}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 ${hoveredCard === i ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <figcaption className={`p-4 text-sm text-neutral-700 leading-relaxed transition-all duration-300 ${hoveredCard === i ? 'text-neutral-900' : ''}`}>
                  {item.text}
                </figcaption>
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full transition-all duration-300 ${hoveredCard === i ? 'bg-[#043d3f] scale-150 shadow-lg' : 'bg-white/70 scale-100'}`} />
              </figure>
            ))}
          </div>

          {/* Indicadores de scroll */}
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: Math.ceil(UGC.length / 3) }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${isVisible ? 'bg-[#043d3f]/40 shadow-sm' : 'bg-neutral-400/60'}`} />
            ))}
          </div>

          <p className={`text-center text-xs text-neutral-600 mt-4 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {isAutoScrolling ? '🖱️ Haz click en las reseñas para centrarlas o desliza manualmente' : '↔️ Desliza para ver más reseñas o haz click para centrar'}
          </p>
        </div>
      </div>

      <style jsx>{`.scrollbar-hide::-webkit-scrollbar {display: none;}`}</style>
    </section>
  );
}