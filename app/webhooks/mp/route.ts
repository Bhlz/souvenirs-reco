// app/api/webhooks/mp/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderByExternalRef, updateOrderByPreference } from '@/lib/store';

// Helper simple para mapear estado
const mapStatus = (s?: string) =>
  (['approved', 'rejected', 'in_process', 'pending'].includes(s || '') ? s : 'unknown') as
    'approved' | 'rejected' | 'in_process' | 'pending' | 'unknown';

export async function POST(req: Request) {
  // (opcional) validador de firma si configuras MP_WEBHOOK_SECRET en el panel
  // La verificación de x-signature depende del tipo de notificación; si configuras
  // el "secret", Mercado Pago envía un header para validar. Revisa la guía oficial. 
  // :contentReference[oaicite:5]{index=5}

  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

  let json: any = null;
  try { json = await req.json(); } catch {}

  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? json?.type ?? json?.action;
  const id = url.searchParams.get('data.id') ?? json?.data?.id ?? json?.id;

  try {
    if (type === 'payment' && id) {
      const payment = await new Payment(client).get({ id: String(id) });
      // :contentReference[oaicite:6]{index=6}

      const status = mapStatus(payment.status as string);
      const preferenceId = (payment as any).preference_id as string | undefined;
      const externalRef = payment.external_reference as string | undefined;

      if (externalRef) {
        await updateOrderByExternalRef(externalRef, {
          status,
          paymentId: String(payment.id),
          raw: payment,
        });
      }
      if (preferenceId) {
        await updateOrderByPreference(preferenceId, {
          status,
          paymentId: String(payment.id),
          raw: payment,
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (type === 'merchant_order' && id) {
      // Fallback: si te llega merchant_order, puedes pedir detalle y
      // actualizar por preference_id
      const moRes = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      }).then(r => r.json());

      const preferenceId = moRes?.preference_id as string | undefined;
      const pmt = moRes?.payments?.[0];
      const status = mapStatus(pmt?.status as string);

      if (preferenceId) {
        await updateOrderByPreference(preferenceId, {
          status,
          paymentId: pmt?.id ? String(pmt.id) : undefined,
          raw: moRes,
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Si no reconocemos el mensaje, responde 200 para evitar reintentos masivos
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('MP webhook error', e);
    // responde 200 igualmente (MP reintenta varias veces)
    return NextResponse.json({ ok: false });
  }
}
