import Image from 'next/image';

export default function Footer() {
  const methods = [
    { src: 'https://1000marcas.net/wp-content/uploads/2019/12/VISA-Logo.png',         alt: 'Visa' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',   alt: 'Mastercard' },
    { src: 'https://1000marcas.net/wp-content/uploads/2022/02/OXXO-Logo.png',         alt: 'OXXO Pay' },
    { src: 'https://cdn.worldvectorlogo.com/logos/spei-1.svg',         alt: 'SPEI' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png',       alt: 'PayPal' },
  ];

  return (
    <footer className="border-t">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-bold">Souvenirs Greco</div>
            <p className="mt-2 text-sm text-neutral-600">
              Piezas auténticas de Jalisco, seleccionadas y listas para regalar.
            </p>
            <div className="mt-2 flex items-center gap-3">
              {methods.map((m, i) => (
                <div key={i} className="relative h-6 w-10">
                  <Image src={m.src} alt={m.alt} fill className="object-contain" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-bold">Ayuda</div>
            <ul className="mt-2 space-y-2 text-sm text-neutral-600">
              <li><a className="hover:underline" href="/envios">Envíos</a></li>
              <li><a className="hover:underline" href="/devoluciones">Metodos de pago</a></li>
              <li><a className="hover:underline" href="/contacto">Contacto</a></li>
            </ul>
          </div>

          <div>
            <div className="font-bold">Síguenos</div>
            <p className="mt-2 text-sm text-neutral-600">Instagram · Facebook · TikTok</p>
          </div>
        </div>

        <div className="mt-8 text-xs text-neutral-500">
          © {new Date().getFullYear()} Souvenirs Greco®. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}