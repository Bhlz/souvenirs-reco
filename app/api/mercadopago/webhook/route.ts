// app/api/checkout/mp/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createOrder, getPriceMap } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { items = [], billing = {}, pricing } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    // Precios SERVER-SIDE
    const priceMap = await getPriceMap();
    const serverItems = items.map((it: { slug: string; qty: number }) => ({
      id: it.slug,
      title: it.slug,
      quantity: Number(it.qty || 1),
      currency_id: 'MXN',
      unit_price: Number(priceMap[it.slug] ?? 0),
    }));

    const origin = new URL(req.url).origin;
    const orderId = randomUUID();

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
    const preference = new Preference(client);

    const body = {
      items: serverItems,
      payer: {
        name: billing?.name,
        email: billing?.email,
      },
      back_urls: {
        success: `${origin}/checkout/result`,
        failure: `${origin}/checkout/result`,
        pending: `${origin}/checkout/result`,
      },
      auto_return: 'approved',
      binary_mode: true, // solo aprueba pagos acreditados, evita 'pending'
      external_reference: orderId,
      metadata: { orderId },
      notification_url: process.env.MP_WEBHOOK_URL ?? `${origin}/api/webhooks/mp`,
    };

    // Crear preferencia
    const pref = await preference.create({ body }); // devuelve id, init_point, sandbox_init_point
    // :contentReference[oaicite:3]{index=3}

    // Guarda el pedido en tu "DB" (filesystem del proyecto)
    const total = pricing?.total ??
      serverItems.reduce((s, it) => s + it.unit_price * it.quantity, 0);

    await createOrder({
      id: orderId,
      preferenceId: pref.id!,
      items: serverItems.map((it) => ({
        slug: it.id as string,
        qty: it.quantity as number,
        price: it.unit_price as number,
      })),
      total,
      status: 'pending',
    });

    return NextResponse.json({
      id: pref.id,
      init_point: pref.init_point,              // URL real (PROD)
      sandbox_init_point: pref.sandbox_init_point, // URL sandbox
    });
  } catch (e: any) {
    console.error('mp create pref error', e);
    return NextResponse.json(
      { error: 'mp_pref_error', details: e?.message },
      { status: 500 }
    );
  }
}
