import { NextRequest } from 'next/server';
import { getOrders, updateOrderByExternalRef, deleteOrder } from '@/lib/store';
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
    const { id, shipment, invoice, status } = await req.json();
    if (!id) return new Response('Bad Request', { status: 400 });
    const patch: Record<string, any> = {};

    if (shipment) {
      patch.shipment = {
        status: shipment.status,
        tracking: shipment.tracking,
        carrier: shipment.carrier,
      };
    }

    if (invoice) patch.invoice = invoice;

    const allowedStatus = ['pending', 'approved', 'rejected', 'in_process', 'unknown'];
    if (allowedStatus.includes(status)) patch.status = status;

    await updateOrderByExternalRef(id, patch);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// DELETE - Eliminar orden
export async function DELETE(req: NextRequest) {
  try {
    await ensureAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID requerido' }, { status: 400 });
    }

    await deleteOrder(id);
    return Response.json({ ok: true });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[admin:orders:DELETE]', e);
    return Response.json({ error: 'Error al eliminar orden' }, { status: 500 });
  }
}
