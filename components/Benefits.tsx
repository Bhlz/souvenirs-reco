import { BadgeCheck, PackageCheck, ReceiptText, Shield } from 'lucide-react';

export default function Benefits() {
  const items = [
    { icon: <PackageCheck className="h-5 w-5"/>, title: 'Empaque de regalo', text: 'Listo para sorprender a quien tú quieras.' },
    { icon: <ReceiptText className="h-5 w-5"/>, title: 'Factura disponible', text: 'Facturamos a personas y empresas.' },
    { icon: <Shield className="h-5 w-5"/>, title: 'Devoluciones 30 días', text: 'Fácil y sin letras chiquitas.' },
    { icon: <BadgeCheck className="h-5 w-5"/>, title: 'Hecho en México', text: 'Artesanos y talleres locales.' },
  ];
  return (
    <section className="container py-10 md:py-16">
      <h2 className="section-title">¿Por qué comprar con nosotros?</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((i, idx) => (
          <div key={idx} className="card">
            <div className="badge mb-2">{i.icon}<span>{i.title}</span></div>
            <p className="text-sm text-neutral-600">{i.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
