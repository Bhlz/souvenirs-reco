import { NextRequest } from 'next/server';
import { addSale, getSales, Sale, updateSale } from '@/lib/sales';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';
import crypto from 'crypto';

async function ensureAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminToken(token);
  if (!ok) throw new Error('unauthorized');
}

const normalize = (raw: any): Sale => {
  const quantity = Number(raw?.quantity ?? 0);
  const cost = Number(raw?.cost ?? 0);
  const price = Number(raw?.price ?? 0);
  const dateStr = raw?.date ? new Date(raw.date).toISOString() : new Date().toISOString();

  return {
    id: raw?.id || crypto.randomUUID(),
    name: (raw?.name ?? '').toString().trim(),
    quantity: Number.isFinite(quantity) ? quantity : 0,
    cost: Number.isFinite(cost) ? cost : 0,
    price: Number.isFinite(price) ? price : 0,
    date: dateStr,
    note: raw?.note ? raw.note.toString().trim() : undefined,
  };
};

const isValid = (s: Sale) => s.name && s.quantity > 0 && s.price >= 0 && s.cost >= 0;

export async function GET(req: NextRequest) {
  try {
    await ensureAuth(req);
    const sales = await getSales();
    return Response.json({ sales });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAuth(req);
    const payload = normalize(await req.json());
    if (!isValid(payload)) {
      return Response.json({ error: 'Campos incompletos' }, { status: 400 });
    }
    await addSale(payload);
    return Response.json({ ok: true, sale: payload });
  } catch (e) {
    if ((e as Error).message === 'unauthorized')
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[admin:sales:POST]', e);
    return Response.json({ error: 'Error al guardar venta' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureAuth(req);
    const payload = normalize(await req.json());
    if (!payload.id || !isValid(payload)) {
      return Response.json({ error: 'Campos incompletos' }, { status: 400 });
    }
    await updateSale(payload);
    return Response.json({ ok: true, sale: payload });
  } catch (e) {
    if ((e as Error).message === 'unauthorized')
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[admin:sales:PUT]', e);
    return Response.json({ error: 'Error al actualizar venta' }, { status: 500 });
  }
}
