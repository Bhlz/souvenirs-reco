// app/api/checkout/wsp/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createOrder } from '@/lib/store';

type ItemIn = { slug: string; qty: number; options?: Record<string,string> };
type Billing = { name?: string; email?: string; rfc?: string };

function currency(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const items: ItemIn[] = Array.isArray(body?.items) ? body.items : [];
    const billing: Billing = body?.billing ?? {};
    const pricing = body?.pricing ?? {};
    const shipping = body?.shipping ?? { id: 'standard', label: 'Envío estándar', cost: 0, eta: '' };
    const coupon = body?.coupon ?? null;

    if (!items.length) {
      return NextResponse.json({ error: 'No items' }, { status: 400 });
    }

    const url = new URL(req.url);
    const origin = process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
    const phone = process.env.WHATSAPP_BUSINESS_NUMBER;
    if (!phone) {
      return NextResponse.json({ error: 'Falta WHATSAPP_BUSINESS_NUMBER' }, { status: 500 });
    }

    // Cargar precios del server
    const all = await getAllProducts();
    const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));

    // Mapea ítems y calcula subtotal por línea
    const orderItems = items.map((it) => {
      const p = bySlug[it.slug];
      if (!p) throw new Error(`Producto inválido: ${it.slug}`);
      // Si manejas precios por variantes en el server, calcula aquí (variantPriceMap)
      const price = Number(p.price);
      return {
        slug: it.slug,
        name: p.name,
        qty: Number(it.qty || 1),
        price, // unitario
        line: price * Number(it.qty || 1), // subtotal línea
        options: it.options ?? null,
      };
    });

    const subtotalSrv = orderItems.reduce((acc, it) => acc + it.line, 0);
    const discount = Number(pricing?.discount || 0);
    const shippingCost = Number(pricing?.shipping || shipping?.cost || 0);
    const total = Math.max(0, subtotalSrv - discount) + shippingCost;

    const orderId = crypto.randomUUID();

    // Guardar orden (no bloquea si falla en hosting read-only)
    try {
      await createOrder({
        id: orderId,
        preferenceId: `whatsapp:${orderId}`,
        items: orderItems.map(({ slug, qty, price }) => ({ slug, qty, price })),
        total,
        status: 'pending',
        raw: { billing, channel: 'whatsapp', coupon, shipping },
      });
    } catch (err) {
      console.warn('No se pudo persistir la orden (continuamos):', (err as any)?.message || err);
    }

    // Texto detallado para WhatsApp
    const lines: string[] = [];
    lines.push(`*Nueva orden #${orderId.slice(0, 8)}*`);
    if (billing?.name)  lines.push(`Cliente: ${billing.name}`);
    if (billing?.email) lines.push(`Email: ${billing.email}`);
    if (billing?.rfc)   lines.push(`RFC: ${billing.rfc}`);
    lines.push('');

    lines.push('*Productos:*');
    for (const it of orderItems) {
      const variantsText = it.options
        ? ' · ' + Object.entries(it.options).map(([k, v]) => `${k}: ${v}`).join(', ')
        : '';
      lines.push(
        `• ${it.name}${variantsText}\n  Cant: ${it.qty} · Precio: ${currency(it.price)} · Subtotal: ${currency(it.line)}`
      );
    }

    lines.push('');
    lines.push(`*Subtotal:* ${currency(subtotalSrv)}`);
    if (coupon && discount > 0) lines.push(`*Cupón (${coupon}):* −${currency(discount)}`);
    if (shippingCost > 0) lines.push(`*Envío (${shipping?.label || 'Seleccionado'}):* ${currency(shippingCost)}`);
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
