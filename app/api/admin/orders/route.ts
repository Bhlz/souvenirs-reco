import { NextRequest } from 'next/server';
import { getOrders, updateOrderByExternalRef } from '@/lib/store';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';

async function ensureAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminToken(token);
  if (!ok) throw new Error('unauthorized');
}

export async function GET(req: NextRequest) {
  try {
    await ensureAuth(req);
    const orders = await getOrders();
    return Response.json({ orders });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureAuth(req);
    const { id, shipment, invoice } = await req.json();
    if (!id) return new Response('Bad Request', { status: 400 });
    await updateOrderByExternalRef(id, { shipment, invoice });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
