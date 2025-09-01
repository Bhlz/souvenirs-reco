'use client';
import { BadgeCheck, PackageCheck, ReceiptText, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Benefits() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const sectionRef = useRef(null);

  const items = [
    { 
      icon: <Shield className="h-5 w-5"/>, 
      title: 'Productos 100% artesanales', 
      text: 'Cada pieza refleja la esencia de México y está hecha a mano con dedicación y detalle.',
      color: 'from-emerald-500 to-teal-600'
    },
    { 
      icon: <PackageCheck className="h-5 w-5"/>, 
      title: 'Envíos seguros y rápidos', 
      text: 'Tus compras llegan en perfectas condiciones a cualquier parte de México y el mundo, con seguimiento disponible.',
      color: 'from-blue-500 to-cyan-600'
    },
    { 
      icon: <ReceiptText className="h-5 w-5"/>, 
      title: 'Variedad inigualable', 
      text: 'Contamos con una amplia selección de souvenirs y artesanías; seguro encontrarás algo único.',
      color: 'from-purple-500 to-indigo-600'
    },
    { 
      icon: <BadgeCheck className="h-5 w-5"/>, 
      title: 'Atención personalizada', 
      text: 'Nuestro equipo te asesora para ayudarte a elegir el producto perfecto según tus necesidades.',
      color: 'from-orange-500 to-red-600'
    },
  ];

  // Intersection Observer para detectar visibilidad
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(entries[0].isIntersecting);
      },
      { threshold: 0.3, rootMargin: '0px 0px -10% 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleCardHover = (index) => {
    setHoveredCard(index);
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  return (
    <section ref={sectionRef} className="container py-10 md:py-16">
      {/* Título animado */}
      <div className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <h2 className="section-title relative overflow-hidden">
          ¿Por qué comprar con nosotros?
          <div 
            className="absolute -bottom-2 left-1/2 h-1 bg-gradient-to-r from-[#043d3f] to-teal-500 rounded-full transition-all duration-700 ease-out"
            style={{ 
              width: isVisible ? '120px' : '0px', 
              transform: 'translateX(-50%)' 
            }}
          />
        </h2>
      </div>

      {/* Grid de beneficios */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
        {items.map((item, idx) => (
          <div 
            key={idx} 
            className={`group relative card overflow-hidden cursor-pointer transition-all duration-500 ease-out transform
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
              ${hoveredCard === idx 
                ? 'scale-105 shadow-xl -rotate-1' 
                : hoveredCard !== null 
                  ? 'scale-95 opacity-70' 
                  : 'hover:scale-102 hover:shadow-lg hover:rotate-1'
              }
            `}
            style={{ 
              transitionDelay: isVisible ? `${idx * 150}ms` : '0ms'
            }}
            onMouseEnter={() => handleCardHover(idx)}
            onMouseLeave={handleCardLeave}
          >
            {/* Gradient background animado */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-1 h-1 bg-current opacity-20 rounded-full transition-all duration-1000 ease-out
                    ${hoveredCard === idx ? 'animate-pulse' : ''}
                  `}
                  style={{
                    left: `${20 + i * 30}%`,
                    top: `${10 + i * 15}%`,
                    animationDelay: `${i * 200}ms`,
                    transform: hoveredCard === idx ? `translateY(-${(i + 1) * 10}px) scale(1.5)` : 'translateY(0) scale(1)',
                  }}
                />
              ))}
            </div>

            {/* Badge con animación mejorada */}
            <div className={`badge mb-3 relative overflow-hidden transition-all duration-300 group-hover:scale-110
              ${hoveredCard === idx ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg' : ''}
            `}>
              <div className={`flex items-center gap-2 relative z-10 transition-all duration-300
                ${hoveredCard === idx ? 'transform scale-110' : ''}
              `}>
                <div className={`transition-all duration-300 ${
                  hoveredCard === idx ? 'rotate-12 scale-125' : 'group-hover:rotate-6'
                }`}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.title}</span>
              </div>
              
              {/* Shine effect */}
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 ease-out
                ${hoveredCard === idx ? 'translate-x-full' : ''}
              `} />
            </div>

            {/* Texto con efecto de typing */}
            <p className={`text-sm text-neutral-600 leading-relaxed transition-all duration-300 relative
              ${hoveredCard === idx ? 'text-neutral-700 transform translate-y-1' : ''}
            `}>
              {item.text}
            </p>

            {/* Corner accent */}
            <div className={`absolute top-0 right-0 w-0 h-0 transition-all duration-300 ease-out
              ${hoveredCard === idx 
                ? `border-l-[15px] border-b-[15px] border-l-transparent border-b-current opacity-20` 
                : ''
              }
            `} 
            style={{ color: hoveredCard === idx ? `rgb(${item.color.includes('emerald') ? '16, 185, 129' : item.color.includes('blue') ? '59, 130, 246' : item.color.includes('purple') ? '139, 92, 246' : '249, 115, 22'})` : 'transparent' }}
            />

            {/* Bottom glow effect */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left`} />
          </div>
        ))}
      </div>

      {/* Floating CTA o información adicional */}
      <div className={`mt-8 text-center transition-all duration-1000 delay-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <p className="text-sm text-neutral-500 flex items-center justify-center gap-2">
          <span className="animate-pulse"></span>
          
          <span className="animate-pulse"></span>
        </p>
      </div>
    </section>
  );
}