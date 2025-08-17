import Image from 'next/image';

export default function Story() {
  return (
    <section id="story" className="bg-neutral-50">
      <div className="container grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
          <Image src="https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?q=80&w=1600" alt="Taller artesanal" fill className="object-cover"/>
        </div>
        <div>
          <h2 className="section-title">Hecho por manos mexicanas</h2>
          <p className="mt-3 text-neutral-700">
            Trabajamos directamente con artesanos de Oaxaca, Puebla, Estado de México y Jalisco. Pagamos precios justos y
            documentamos el origen de cada pieza para garantizar autenticidad.
          </p>
          <ul className="mt-4 list-disc pl-5 text-neutral-700">
            <li>Relación directa con talleres</li>
            <li>Certificados de autenticidad</li>
            <li>Empaque seguro y listo para regalo</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
