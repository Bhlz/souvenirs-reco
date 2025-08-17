export default function ThankYou({ searchParams }: { searchParams: { status?: string }}) {
  const status = searchParams?.status || 'unknown';
  return (
    <div className="container py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">¡Gracias por tu compra!</h1>
      <p className="text-neutral-700">Estado del pago: <strong>{status}</strong></p>
      <a href="/" className="btn-primary mt-8 inline-block">Volver a la tienda</a>
    </div>
  );
}
