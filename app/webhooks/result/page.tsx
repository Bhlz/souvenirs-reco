// app/checkout/result/page.tsx
export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  return (
    <div className="container py-16">
      <h1 className="text-2xl font-bold">Resultado del pago</h1>
      <div className="mt-4 grid gap-1 text-sm">
        <div><b>Estado:</b> {sp.status ?? 'desconocido'}</div>
        <div><b>payment_id:</b> {sp.payment_id ?? '-'}</div>
        <div><b>preference_id:</b> {sp.preference_id ?? '-'}</div>
        <div><b>external_reference:</b> {sp.external_reference ?? '-'}</div>
      </div>
      <a className="btn-primary mt-6 inline-block" href="/cart">Volver al carrito</a>
    </div>
  );
}
