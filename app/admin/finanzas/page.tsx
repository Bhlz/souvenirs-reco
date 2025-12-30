export default function FinanzasPlaceholder() {
  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Finanzas</p>
        <h1 className="text-2xl font-bold text-slate-900">Próximamente</h1>
        <p className="text-sm text-slate-600">
          Estamos preparando un panel con flujo de caja, márgenes y conciliación de ventas. Mantente atento.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge>Reportes automáticos</Badge>
        <Badge>Gráficas limpias</Badge>
        <Badge>Exportación a CSV</Badge>
      </div>

      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
        Aquí verás tus números clave sin complicaciones. Tendremos alertas de liquidez y tips accionables.
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
      {children}
    </span>
  );
}
