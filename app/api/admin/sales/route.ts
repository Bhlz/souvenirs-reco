import { NextRequest } from 'next/server';
import { addSale, deleteSale, getSales, Sale, updateSale } from '@/lib/sales';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';

async function ensureAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminToken(token);
  if (!ok) throw new Error('unauthorized');
}

const toLocalDateISOString = (input: any) => {
  const base = input ? new Date(input) : new Date();
  if (Number.isNaN(base.getTime())) return new Date().toISOString();
  // Fija al mediodía local para evitar corrimientos por zona horaria.
  const local = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0);
  return local.toISOString();
};

const normalize = (raw: any): Omit<Sale, 'id'> & { id?: string } => {
  const quantity = Number(raw?.quantity ?? 0);
  const cost = Number(raw?.cost ?? 0);
  const price = Number(raw?.price ?? 0);
  const dateStr = toLocalDateISOString(raw?.date);

  return {
    id: raw?.id || undefined,
    name: (raw?.name ?? '').toString().trim(),
    quantity: Number.isFinite(quantity) ? quantity : 0,
    cost: Number.isFinite(cost) ? cost : 0,
    price: Number.isFinite(price) ? price : 0,
    date: dateStr,
    note: raw?.note ? raw.note.toString().trim() : undefined,
  };
};

const isValid = (s: Omit<Sale, 'id'>) => s.name && s.quantity > 0 && s.price >= 0 && s.cost >= 0;

// GET - Obtener todas las ventas
export async function GET(req: NextRequest) {
  try {
    await ensureAuth(req);
    const sales = await getSales();
    return Response.json({ sales });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[admin:sales:GET]', e);
    return Response.json({ error: 'Error al cargar ventas' }, { status: 500 });
  }
}

// POST - Crear nueva venta
export async function POST(req: NextRequest) {
  try {
    await ensureAuth(req);
    const payload = normalize(await req.json());
    if (!isValid(payload)) {
      return Response.json({ error: 'Campos incompletos' }, { status: 400 });
    }
    const sale = await addSale(payload);
    return Response.json({ ok: true, sale });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[admin:sales:POST]', e);
    return Response.json({ error: 'Error al guardar venta' }, { status: 500 });
  }
}

// PUT - Actualizar venta existente
export async function PUT(req: NextRequest) {
  try {
    await ensureAuth(req);
    const raw = await req.json();
    const payload = normalize(raw);
    if (!raw.id || !isValid(payload)) {
      return Response.json({ error: 'Campos incompletos' }, { status: 400 });
    }
    const sale = await updateSale({ ...payload, id: raw.id } as Sale);
    return Response.json({ ok: true, sale });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[admin:sales:PUT]', e);
    return Response.json({ error: 'Error al actualizar venta' }, { status: 500 });
  }
}

// DELETE - Eliminar venta
export async function DELETE(req: NextRequest) {
  try {
    await ensureAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID requerido' }, { status: 400 });
    }

    await deleteSale(id);
    return Response.json({ ok: true });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[admin:sales:DELETE]', e);
    return Response.json({ error: 'Error al eliminar venta' }, { status: 500 });
  }
}
