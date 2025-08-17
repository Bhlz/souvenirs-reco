import Image from 'next/image';

export default function Footer() {
  const methods = [
    { src: '/logos/visa.svg', alt: 'Visa' },
    { src: '/logos/mastercard.svg', alt: 'Mastercard' },
    { src: '/logos/oxxo.svg', alt: 'OXXO Pay' },
    { src: '/logos/spei.svg', alt: 'SPEI' },
    { src: '/logos/paypal.svg', alt: 'PayPal' },
  ];
  return (
    <footer className="border-t">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-bold">SouvenirsMX</div>
            <p className="mt-2 text-sm text-neutral-600">Piezas auténticas, envío rápido y empaques listos para regalo.</p>
          </div>
          <div className="text-sm">
            <div className="font-semibold">Ayuda</div>
            <ul className="mt-2 space-y-1">
              <li><a href="#faq" className="hover:underline">Envíos y devoluciones</a></li>
              <li><a href="#" className="hover:underline">Política de privacidad</a></li>
              <li><a href="#" className="hover:underline">Facturación</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="font-semibold">Pagos</div>
            <div className="mt-2 flex items-center gap-3">
              {methods.map((m,i)=> (
                <div key={i} className="relative h-6 w-10">
                  <Image src={m.src} alt={m.alt} fill className="object-contain"/>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 text-xs text-neutral-500">© {new Date().getFullYear()} SouvenirsMX. Todos los derechos reservados.</div>
      </div>
    </footer>
  );
}
