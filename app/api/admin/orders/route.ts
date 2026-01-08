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
    const body = await req.json();
    const { id, invoice, status } = body;
    // Acepta tanto 'shipment' como 'shipmentInfo' del frontend
    const shipmentData = body.shipmentInfo || body.shipment;

    if (!id) return new Response('Bad Request', { status: 400 });
    const patch: Record<string, any> = {};

    if (shipmentData) {
      patch.shipmentInfo = {
        status: shipmentData.status,
        tracking: shipmentData.tracking,
        carrier: shipmentData.carrier,
      };
    }

    if (invoice) patch.invoice = invoice;

    const allowedStatus = ['pending', 'approved', 'rejected', 'in_process', 'unknown'];
    if (allowedStatus.includes(status)) patch.status = status;

    await updateOrderByExternalRef(id, patch);
    return Response.json({ ok: true });
  } catch (e) {
    console.error('[orders:PUT]', e);
    return Response.json({ error: 'Error al actualizar orden' }, { status: 500 });
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
