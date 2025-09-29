// app/api/orders/[id]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/store';

// En Next 15, params es Promise<{ id: string }>, así que lo aguardamos
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const all = await getOrders().catch(() => []);
    const order = all.find((o: any) => o.id === id);

    if (!order) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
