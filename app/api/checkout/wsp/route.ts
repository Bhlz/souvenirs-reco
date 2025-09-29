// app/api/checkout/wsp/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createOrder } from '@/lib/store';

function currency(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const items: { slug: string; qty: number; variants?: Record<string,string> }[] =
      Array.isArray(body?.items) ? body.items : [];
    const billing = body?.billing ?? {};
    if (!items.length) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    const url = new URL(req.url);
    const origin = process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
    const phone = process.env.WHATSAPP_BUSINESS_NUMBER;
    if (!phone) {
      return NextResponse.json(
        { error: 'Falta WHATSAPP_BUSINESS_NUMBER' },
        { status: 500 }
      );
    }

    // Precios del server
    const all = await getAllProducts();
    const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));

    const orderItems = items.map((it) => {
      const p = bySlug[it.slug];
      if (!p) throw new Error(`Producto inválido: ${it.slug}`);
      return {
        slug: it.slug,
        name: p.name,
        qty: Number(it.qty || 1),
        price: Number(p.price), // precio base (puedes mapear variantes si ya guardas variantPriceMap)
        variants: it.variants || null,
      };
    });

    const subtotal = orderItems.reduce((acc, it) => acc + it.price * it.qty, 0);
    const total = subtotal; // aquí podrías sumar envío/desc., etc.

    // ID local de orden (web crypto)
    const orderId = crypto.randomUUID();

    // Guardar orden (si falla en Vercel por FS read-only, no bloquea el flujo)
    try {
      await createOrder({
        id: orderId,
        preferenceId: `whatsapp:${orderId}`,
        items: orderItems.map(({ slug, qty, price }) => ({ slug, qty, price })),
        total,
        status: 'pending', // la “aprobación” ahora es manual al cerrar en WhatsApp
        raw: { billing, channel: 'whatsapp' },
      });
    } catch (err) {
      console.warn('No se pudo persistir la orden (continuamos):', (err as any)?.message || err);
    }

    // Texto para WhatsApp
    const lines: string[] = [];
    lines.push(`*Nueva orden #${orderId.slice(0, 8)}*`);
    if (billing?.name) lines.push(`Cliente: ${billing.name}`);
    if (billing?.email) lines.push(`Email: ${billing.email}`);
    lines.push('');
    lines.push('*Productos:*');

    for (const it of orderItems) {
      const variantsText = it.variants
        ? ' · ' + Object.entries(it.variants).map(([k, v]) => `${k}: ${v}`).join(', ')
        : '';
      lines.push(
        `• ${it.name}${variantsText}\n  Cant: ${it.qty}  ·  ${currency(it.price)} c/u`
      );
    }

    lines.push('');
    lines.push(`*Total:* ${currency(total)}`);
    lines.push('');
    lines.push(`Ver pedido: ${origin}/order/${orderId}`);
    lines.push('');
    lines.push('Hola 👋, me interesa confirmar la disponibilidad y finalizar el pedido.');

    const text = encodeURIComponent(lines.join('\n'));
    const chatUrl = `https://wa.me/${phone}?text=${text}`;

    return NextResponse.json({ chatUrl, orderId });
  } catch (e: any) {
    console.error('wsp checkout error', e);
    return NextResponse.json({ error: 'wsp_error', details: e?.message }, { status: 500 });
  }
}
