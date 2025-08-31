// app/thank-you/page.tsx
export default async function ThankYou({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;   // 👈 await

  return (
    <div className="container py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">¡Gracias por tu compra!</h1>
      <p className="text-neutral-700">
        Estado del pago: <strong>{status ?? "unknown"}</strong>
      </p>
      <a href="/" className="btn-primary mt-8 inline-block">
        Volver a la tienda
      </a>
    </div>
  );
}
