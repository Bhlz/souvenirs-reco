import { NextRequest } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { getAllProducts } from '@/lib/store';
import { createOrder } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: { slug: string; qty: number }[] = body?.items || [];
    const billing = body?.billing || null;
    if (!Array.isArray(items) || items.length === 0) return new Response('Bad Request', { status: 400 });

    const all = await getAllProducts();
    const bySlug = Object.fromEntries(all.map(p => [p.slug, p]));
    const orderItems = items.map(it => {
      const p = bySlug[it.slug];
      if (!p) throw new Error('Invalid product');
      return { slug: it.slug, qty: it.qty, price: p.price, title: p.name };
    });

    const total = orderItems.reduce((s, it) => s + it.price * it.qty, 0);
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const preference = new Preference(client);

    const orderId = crypto.randomUUID();

    const pref = await preference.create({
      body: {
        items: orderItems.map(it => ({
           id: it.slug,
          title: it.title,
          quantity: it.qty,
          currency_id: 'MXN',
          unit_price: Number(it.price),
        })),
        back_urls: {
          success: `${base}/thank-you?status=success`,
          failure: `${base}/thank-you?status=failure`,
          pending: `${base}/thank-you?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${base}/api/mercadopago/webhook`,
        external_reference: orderId,
        metadata: { orderId, billing },
      }
    });

    await createOrder({
      id: orderId,
      preferenceId: pref.id!,
      items: orderItems.map(({slug, qty, price}) => ({slug, qty, price})),
      total,
      status: 'pending',
      raw: { billing },
    });

    return Response.json({ init_point: pref.init_point, id: pref.id, orderId });
  } catch (e: any) {
    console.error(e);
    return new Response('Error creating preference', { status: 500 });
  }
}
