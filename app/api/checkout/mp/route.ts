// app/api/checkout/mp/route.ts
export const runtime = 'nodejs'; // fuerza Node.js (SDK oficial funciona aquí)

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getAllProducts, createOrder } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    // 1) Credencial obligatoria
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Falta MP_ACCESS_TOKEN en variables de entorno' },
        { status: 500 }
      );
    }

    // 2) Datos de la solicitud
    const body = await req.json().catch(() => ({}));
    const items: { slug: string; qty: number }[] = Array.isArray(body?.items) ? body.items : [];
    const billing = body?.billing ?? null;
    const pricing = body?.pricing ?? null; // { subtotal, discount, shipping, total, coupon }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    // 3) Precios del server (anti-manipulación)
    const all = await getAllProducts();
    const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));

    const orderItems = items.map((it) => {
      const p = bySlug[it.slug];
      if (!p) throw new Error(`Producto inválido: ${it.slug}`);
      return { slug: it.slug, title: p.name, qty: Number(it.qty || 1), price: Number(p.price) };
    });

    const serverSubtotal = orderItems.reduce((s, it) => s + it.price * it.qty, 0);
    const total = Number(pricing?.total ?? serverSubtotal);

    // 4) Origin correcto (prod o local)
    const url = new URL(req.url);
    const origin = process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;

    // 5) MP SDK
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const preference = new Preference(client);

    // 6) ID local de orden (usa Web Crypto para evitar imports problemáticos)
    const orderId = crypto.randomUUID();

    // 7) Crear preferencia Checkout Pro
    const pref = await preference.create({
      body: {
        items: orderItems.map((it) => ({
          id: it.slug,
          title: it.title,
          quantity: it.qty,
          currency_id: 'MXN',
          unit_price: it.price,
        })),
        payer: {
          name: billing?.name,
          email: billing?.email,
        },
        back_urls: {
          success: `${origin}/checkout/result`,
          failure: `${origin}/checkout/result`,
          pending: `${origin}/checkout/result`,
        },
        auto_return: 'approved', // solo redirect/mobile
        binary_mode: true,
        notification_url: process.env.MP_WEBHOOK_URL ?? `${origin}/api/webhooks/mp`,
        external_reference: orderId,
        metadata: { orderId, billing, pricingSnapshot: pricing ?? null },
      },
    });

    // 8) Guardar orden con todos los datos
    try {
      await createOrder({
        id: orderId,
        preferenceId: pref.id!,
        items: orderItems.map(({ slug, title, qty, price }) => ({
          slug,
          name: title,
          qty,
          price
        })),
        subtotal: serverSubtotal,
        discount: Number(pricing?.discount ?? 0),
        shipping: Number(pricing?.shipping ?? 0),
        total,
        status: 'pending',
        billing: billing ? {
          name: billing.name,
          email: billing.email,
          phone: billing.phone,
          rfc: billing.rfc,
        } : undefined,
        raw: { billing, pricing },
      });
    } catch (err: any) {
      // En Vercel, el FS es read-only. Registramos y seguimos.
      console.warn('No se pudo persistir la orden (continuamos de todos modos):', err?.message || err);
    }

    // 9) Devolver URL de pago
    return NextResponse.json({
      id: pref.id,
      init_point: pref.init_point,                 // PROD
      sandbox_init_point: pref.sandbox_init_point, // SANDBOX
    });
  } catch (e: any) {
    console.error('mp create pref error', e?.message || e);
    return NextResponse.json(
      { error: 'mp_pref_error', details: e?.message ?? 'unknown' },
      { status: 500 }
    );
  }
}
