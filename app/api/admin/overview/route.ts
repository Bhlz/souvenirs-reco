import { NextRequest } from 'next/server';
import { getAllProducts, getOrders } from '@/lib/store';
import { getSales, summarizeSales } from '@/lib/sales';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';

async function ensureAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminToken(token);
  if (!ok) throw new Error('unauthorized');
}

export async function GET(req: NextRequest) {
  try {
    await ensureAuth(req);
    const [products, orders, sales] = await Promise.all([getAllProducts(), getOrders(), getSales()]);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const pendingOrders = orders.filter((o) =>
      ['pending', 'in_process', 'unknown'].includes(o.status)
    ).length;
    const shippedOrders = orders.filter((o) => o.shipment?.status === 'shipped').length;
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 5);
    const recentOrders = [...orders].slice(-10).reverse();
    const topProducts = [...products]
      .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
      .slice(0, 6);

    const salesSummary = summarizeSales(sales);

    return Response.json({
      metrics: {
        totalRevenue,
        pendingOrders,
        shippedOrders,
        productCount: products.length,
        ordersCount: orders.length,
      },
      lowStock,
      recentOrders,
      topProducts,
      salesSummary,
      updatedAt: Date.now(),
    });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[admin:overview]', e);
    return Response.json({ error: 'Error al cargar dashboard' }, { status: 500 });
  }
}
