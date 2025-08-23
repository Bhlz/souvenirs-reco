import Image from 'next/image';

export default function Footer() {
  const methods = [
    { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1280px-Visa_Inc._logo.svg.png', alt: 'Visa' },
    { src: ' https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg', alt: 'Mastercard' },
    { src: 'https://media.informabtl.com/wp-content/uploads/2016/04/OXXO-01-e1459812964813-310x194.png', alt: 'OXXO Pay' },
    { src: 'https://ghanasoccernet.com/zm/wp-content/uploads/sites/7/2020/11/spei.png', alt: 'SPEI' },
    { src: 'https://cdn.worldvectorlogo.com/logos/paypal-3.svg', alt: 'PayPal' },
  ];
  return (
    <footer className="border-t">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-bold">Souvenirs Greco</div>
            <p className="mt-2 text-sm text-neutral-600">La esencia de México en tus manos.</p>
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
        <div className="mt-8 text-xs text-neutral-500">© {new Date().getFullYear()} Souvenirs Greco®. Todos los derechos reservados.</div>
      </div>
    </footer>
  );
}
