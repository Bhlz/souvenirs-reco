'use client';
import { useState } from 'react';

const QA = [
  { q: '¿Cuánto tarda el envío?', a: 'Entre 24 y 72 horas hábiles según tu código postal. Mostramos estimado al pagar.' },
  { q: '¿Los productos son auténticos?', a: 'Sí, todos nuestros artículos son 100% artesanales y hechos por artesanos de México, garantizando calidad y originalidad.' },
  { q: '¿Puedo facturar?', a: 'Sí, al finalizar tu compra podrás cargar tus datos fiscales para factura.' },
  { q: '¿Qué métodos de pago aceptan?', a: 'Tarjetas de crédito y débito, MSI en campañas, SPEI, OXXO Pay y PayPal.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number|null>(0);
  return (
    <section id="faq" className="container py-10 md:py-16">
      <h2 className="section-title">Preguntas frecuentes</h2>
      <div className="mt-6 divide-y rounded-3xl border">
        {QA.map((item, i) => (
          <details key={i} open={open===i} onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) { setOpen(i); } }}>
            <summary className="cursor-pointer select-none px-6 py-4 font-medium">{item.q}</summary>
            <div className="px-6 pb-6 text-neutral-700">{item.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
