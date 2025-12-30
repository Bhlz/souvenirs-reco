import {
  Bell,
  Globe,
  Mail,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
} from 'lucide-react';
import type { ReactNode } from 'react';

const brandPalette = [
  { name: 'Primario', value: '#0f766e', usage: 'Botones, links y acentos' },
  { name: 'Secundario', value: '#fbbf24', usage: 'Destacados y alertas suaves' },
  { name: 'Neutro', value: '#0f172a', usage: 'Texto y contrastes' },
];

const notificationChannels = [
  { label: 'Confirmación de compra', channel: 'Correo + WhatsApp', status: 'Activo' },
  { label: 'Pago pendiente', channel: 'Correo', status: 'Revisar texto' },
  { label: 'Pedido enviado', channel: 'WhatsApp', status: 'Automático' },
];

const operations = [
  { label: 'Recoger en tienda', detail: 'Disponible en 2 sucursales', status: 'Activo' },
  { label: 'Envío nacional', detail: 'Estafeta y DHL (1-3 días)', status: 'Configurado' },
  { label: 'Política de devoluciones', detail: 'Ventana de 15 días', status: 'Visible en checkout' },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Ajustes</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Panel de configuración</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Ten a la mano todo lo esencial: identidad visual, mensajes automáticos y reglas operativas.
              Nada se guarda aún, es solo una vista previa de cómo quedará tu centro de control.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Configura en 3 pasos
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
                Ayudas visuales incluidas
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Todo listo para personalizar
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <Card title="Identidad de marca" icon={<Palette className="h-5 w-5 text-emerald-700" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Define colores y tono visual para que cada botón y tarjeta se vean coherentes.
                </p>
                <div className="space-y-3">
                  {brandPalette.map((c) => (
                    <div
                      key={c.value}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-8 w-8 rounded-lg shadow-inner ring-1 ring-slate-200"
                          style={{ background: c.value }}
                          aria-hidden
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-600">{c.usage}</div>
                        </div>
                      </div>
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{c.value}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                    SG
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tarjeta de referencia</div>
                    <div className="text-xs text-slate-600">Así se verán los componentes clave</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-slate-700 shadow-sm ring-1 ring-emerald-100">
                    <span>Botón primario</span>
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      Comprar ahora
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-slate-700 shadow-sm ring-1 ring-amber-100">
                    <span>Etiqueta de alerta</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Stock bajo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Automatizaciones y mensajes" icon={<Bell className="h-5 w-5 text-amber-600" />}>
            <p className="text-sm text-slate-600">
              Decide cómo avisas a tus clientes en cada evento. Cada chip indica canal y estado.
            </p>
            <div className="mt-4 space-y-3">
              {notificationChannels.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                    <div className="text-xs text-slate-600">{item.channel}</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <MiniCard icon={<Mail className="h-4 w-4 text-amber-600" />} title="Plantillas">
                Previsualiza asunto, tono y firma antes de enviarlos.
              </MiniCard>
              <MiniCard icon={<Smartphone className="h-4 w-4 text-emerald-600" />} title="WhatsApp">
                Mantén los links de seguimiento y emojis coherentes.
              </MiniCard>
            </div>
          </Card>

          <Card title="Operación y logística" icon={<Truck className="h-5 w-5 text-sky-600" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                {operations.map((o) => (
                  <div
                    key={o.label}
                    className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">{o.label}</div>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                        {o.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{o.detail}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Checklist rápido
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    Define horarios de corte y tiempo de preparación.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                    Subir guías o etiquetas desde tu paquetería.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                    Habilitar mensajes de seguimiento con link directo.
                  </li>
                </ul>
                <div className="mt-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white p-3 text-xs text-emerald-800">
                  Tip: mantén visible el SLA de entrega; reduce dudas y tickets.
                </div>
              </div>
            </div>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card title="Visibilidad pública" icon={<Globe className="h-5 w-5 text-slate-700" />}>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <span>Banner de envíos</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <span>Página de políticas</span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                  Revisar links
                </span>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white">
              Vista rápida: <span className="font-semibold text-amber-300">souvenirs.mx/politicas</span>
            </div>
          </Card>

          <Card title="Seguridad y acceso" icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <span>Clave de admin</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  Fuerte
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <span>2FA con código</span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                  Por activar
                </span>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 text-xs font-semibold text-white shadow-sm">
              Recomendación: habilita alertas al iniciar sesión desde un nuevo dispositivo.
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
          {icon}
        </span>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MiniCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-xs text-slate-600">{children}</p>
    </div>
  );
}
