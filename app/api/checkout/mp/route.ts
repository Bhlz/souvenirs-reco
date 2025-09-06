// app/api/checkout/mp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getAllProducts, createOrder } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Falta MP_ACCESS_TOKEN en variables de entorno' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const items: { slug: string; qty: number }[] = Array.isArray(body?.items) ? body.items : [];
    const billing = body?.billing ?? null;
    const pricing = body?.pricing ?? null; // { subtotal, discount, shipping, total, coupon }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    // Precios y nombres del server (evita manipulación desde el cliente)
    const all = await getAllProducts();
    const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));

    const orderItems = items.map((it) => {
      const p = bySlug[it.slug];
      if (!p) throw new Error(`Producto inválido: ${it.slug}`);
      return {
        slug: it.slug,
        title: p.name,
        qty: Number(it.qty || 1),
        price: Number(p.price),
      };
    });

    // Total “seguro” del server; si mandaste un resumen desde el carrito lo guardamos solo como referencia
    const serverSubtotal = orderItems.reduce((s, it) => s + it.price * it.qty, 0);
    const total = Number(pricing?.total ?? serverSubtotal);

    // Base URL: usa NEXT_PUBLIC_BASE_URL si está; si no, deriva del request
    const url = new URL(req.url);
    const origin = process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;

    // Instancia de MP
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    // ID local de la orden para reconciliar en el webhook
    const orderId = randomUUID();

    // Crea preferencia de Checkout Pro
    const pref = await preference.create({
      body: {
        items: orderItems.map((it) => ({
          id: it.slug,                // id único; usamos el slug
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
        auto_return: 'approved', // vuelve solo cuando queda aprobado (redirect/mobile)
        binary_mode: true,       // evita estados intermedios, sólo pagos acreditados
        notification_url: process.env.MP_WEBHOOK_URL ?? `${origin}/api/webhooks/mp`,
        external_reference: orderId,
        metadata: {
          orderId,
          billing,
          pricingSnapshot: pricing ?? null, // guardamos el snapshot enviado por el cliente (no confiable)
        },
      },
    });

    // Guarda la orden en tu “DB” local (filesystem) con estado pendiente
    await createOrder({
      id: orderId,
      preferenceId: pref.id!,
      items: orderItems.map(({ slug, qty, price }) => ({ slug, qty, price })),
      total,
      status: 'pending',
      raw: { billing, pricing },
    });

    // Devuelve URLs para redirigir
    return NextResponse.json({
      id: pref.id,
      init_point: pref.init_point,                 // PROD
      sandbox_init_point: pref.sandbox_init_point // SANDBOX
    });
  } catch (e: any) {
    console.error('mp create pref error', e);
    return NextResponse.json(
      { error: 'mp_pref_error', details: e?.message ?? 'unknown' },
      { status: 500 }
    );
  }
}
