'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function Story() {
  const [visibleElements, setVisibleElements] = useState(new Set());
  const observerRef = useRef(null);
  const elementsRef = useRef([]);

  useEffect(() => {
    // Crear el Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Elemento entra en vista - lo hacemos visible
            setVisibleElements(prev => {
              const newSet = new Set(prev);
              newSet.add(entry.target.id);
              return newSet;
            });
          } else {
            // Elemento sale de vista - lo ocultamos
            setVisibleElements(prev => {
              const newSet = new Set(prev);
              newSet.delete(entry.target.id);
              return newSet;
            });
          }
        });
      },
      {
        threshold: 0.15, // Se activa cuando el 15% del elemento es visible
        rootMargin: '0px 0px -10% 0px' // Margen para activar un poco antes
      }
    );

    // Observar todos los elementos
    elementsRef.current.forEach(element => {
      if (element) observerRef.current.observe(element);
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const addToRefs = (el) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };

  const getAnimationClass = (elementId, baseDelay = 0) => {
    const isVisible = visibleElements.has(elementId);
    return `transition-all duration-700 ease-out ${
      baseDelay > 0 ? `delay-${baseDelay}` : ''
    } ${
      isVisible 
        ? 'opacity-100 translate-y-0' 
        : 'opacity-0 translate-y-8'
    }`;
  };

  return (
    <section id="story" className="bg-neutral-50 overflow-hidden">
      <div className="container grid items-center gap-12 py-16 md:grid-cols-2 md:py-24 lg:gap-16">
        <div 
          ref={addToRefs}
          id="story-image"
          className={`relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl ${getAnimationClass('story-image')}`}
        >
          <Image 
            src="/logos/logosouvenirs-greco.jpg" 
            alt="Catedral GDL" 
            fill 
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
        
        <div className="space-y-6">
          <div 
            ref={addToRefs}
            id="story-title"
            className={getAnimationClass('story-title')}
          >
            <h2 className="text-4xl font-bold text-neutral-900 md:text-5xl">
              Nuestra Historia
            </h2>
            <div className="mt-2 h-1 w-20 rounded-full" style={{ background: '#043d3f' }}></div>
          </div>
          
          <div className="space-y-4 text-lg leading-relaxed text-neutral-700">
            <p 
              ref={addToRefs}
              id="story-p1"
              className={getAnimationClass('story-p1')}
              style={{ transitionDelay: visibleElements.has('story-p1') ? '100ms' : '400ms' }}
            >
              <span className="font-semibold text-neutral-900">Souvenirs Greco</span> nació en 2025, 
              impulsado por la experiencia y respaldo de Artesanías Noé, con la misión de compartir 
              la esencia de México y en especial de Jalisco a través de piezas únicas y auténticas.
            </p>
            
            <p 
              ref={addToRefs}
              id="story-p2"
              className={getAnimationClass('story-p2')}
              style={{ transitionDelay: visibleElements.has('story-p2') ? '200ms' : '300ms' }}
            >
              Ubicados en el corazón del tradicional <span className="font-medium text-neutral-900">
              Mercado Libertad (San Juan de Dios)</span> en Guadalajara, nuestros locales se han 
              convertido en un espacio donde visitantes y locales pueden encontrar un pedacito de 
              nuestra cultura. Cada artículo que ofrecemos refleja la identidad, el color y el 
              orgullo de nuestra tierra.
            </p>
            
            <p 
              ref={addToRefs}
              id="story-p3"
              className={getAnimationClass('story-p3')}
              style={{ transitionDelay: visibleElements.has('story-p3') ? '300ms' : '200ms' }}
            >
              Más que un negocio, somos un proyecto que busca llevar la esencia de México al mundo, 
              con envíos nacionales e internacionales que permiten que cada cliente tenga consigo 
              un recuerdo que trasciende fronteras.
            </p>
            
            <p 
              ref={addToRefs}
              id="story-quote"
              className={`italic pl-4 py-2 bg-white rounded-r-lg ${getAnimationClass('story-quote')}`}
              style={{ 
                transitionDelay: visibleElements.has('story-quote') ? '400ms' : '100ms',
                borderLeft: '4px solid #043d3f'
              }}
            >
              "En Souvenirs Greco creemos que cada souvenir cuenta una historia, y nuestra misión 
              es que cada persona que nos visite se lleve no solo un producto, sino también una 
              parte de nuestra cultura y tradiciones."
            </p>
          </div>
          
          <div 
            ref={addToRefs}
            id="story-list"
            className={`pt-4 ${getAnimationClass('story-list')}`}
            style={{ transitionDelay: visibleElements.has('story-list') ? '500ms' : '0ms' }}
          >
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              ¿Por qué elegirnos?
            </h3>
            <ul className="space-y-3">
              <li className={`flex items-start gap-3 transition-all duration-500 hover:translate-x-2 ${
                visibleElements.has('story-list') ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: visibleElements.has('story-list') ? '600ms' : '0ms' }}>
                <span className="text-xl mt-0.5" style={{ color: '#043d3f' }}>•</span>
                <span className="text-neutral-700">
                  <strong className="text-neutral-900">Hecho a mano:</strong> Cada producto es elaborado por artesanos de distintas partes de México, garantizando autenticidad y tradición en cada pieza.
                </span>
              </li>
              <li className={`flex items-start gap-3 transition-all duration-500 hover:translate-x-2 ${
                visibleElements.has('story-list') ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: visibleElements.has('story-list') ? '700ms' : '0ms' }}>
                <span className="text-xl mt-0.5" style={{ color: '#043d3f' }}>•</span>
                <span className="text-neutral-700">
                  <strong className="text-neutral-900">Variedad y calidad:</strong> Contamos con el mayor surtido y productos de alta calidad en todo el Mercado Libertad (San Juan de Dios).
                </span>
              </li>
              <li className={`flex items-start gap-3 transition-all duration-500 hover:translate-x-2 ${
                visibleElements.has('story-list') ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transitionDelay: visibleElements.has('story-list') ? '800ms' : '0ms' }}>
                <span className="text-xl mt-0.5" style={{ color: '#043d3f' }}>•</span>
                <span className="text-neutral-700">
                  <strong className="text-neutral-900">Envíos seguros:</strong> Llevamos tus recuerdos favoritos a cualquier parte del mundo de manera rápida y protegida.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}