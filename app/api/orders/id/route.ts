// app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const all = await getOrders().catch(() => []);
    const order = all.find(o => o.id === params.id);
    if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
