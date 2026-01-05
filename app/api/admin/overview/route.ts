import { NextRequest } from 'next/server';
import { getAllProducts, getOrders } from '@/lib/store';
import { getSales, summarizeSales, getTodaySales, getYesterdaySales, getCurrentMonthSales } from '@/lib/sales';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';

async function ensureAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminToken(token);
  if (!ok) throw new Error('unauthorized');
}

export async function GET(req: NextRequest) {
  try {
    await ensureAuth(req);

    // Obtener datos en paralelo para mejor rendimiento
    const [products, orders, allSales, todaySales, yesterdaySales, monthSales] = await Promise.all([
      getAllProducts(),
      getOrders(),
      getSales(),
      getTodaySales(),
      getYesterdaySales(),
      getCurrentMonthSales(),
    ]);

    // Métricas de órdenes online
    const totalOnlineRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const pendingOrders = orders.filter((o) =>
      ['pending', 'in_process', 'unknown'].includes(o.status)
    ).length;
    const shippedOrders = orders.filter((o) => o.shipmentInfo?.status === 'shipped').length;
    const approvedOrders = orders.filter((o) => o.status === 'approved').length;

    // Productos
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 5);
    const recentOrders = [...orders].slice(-10).reverse();
    const topProducts = [...products]
      .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
      .slice(0, 6);

    // Métricas de ventas físicas
    const allSalesSummary = summarizeSales(allSales);
    const todaySummary = summarizeSales(todaySales);
    const yesterdaySummary = summarizeSales(yesterdaySales);
    const monthSummary = summarizeSales(monthSales);

    // Comparación día a día
    const todayVsYesterday = yesterdaySummary.totalRevenue > 0
      ? ((todaySummary.totalRevenue - yesterdaySummary.totalRevenue) / yesterdaySummary.totalRevenue * 100).toFixed(1)
      : todaySummary.totalRevenue > 0 ? '+100' : '0';

    // Ingreso total combinado (online + físico)
    const totalCombinedRevenue = totalOnlineRevenue + allSalesSummary.totalRevenue;

    return Response.json({
      metrics: {
        // Ingresos totales
        totalRevenue: totalCombinedRevenue,
        onlineRevenue: totalOnlineRevenue,
        physicalRevenue: allSalesSummary.totalRevenue,

        // Órdenes
        pendingOrders,
        shippedOrders,
        approvedOrders,
        ordersCount: orders.length,

        // Productos
        productCount: products.length,
        lowStockCount: lowStock.length,

        // Ventas físicas hoy
        todayRevenue: todaySummary.totalRevenue,
        todayProfit: todaySummary.profit,
        todaySalesCount: todaySales.length,

        // Comparación
        revenueChange: todayVsYesterday, // porcentaje de cambio vs ayer

        // Mes actual
        monthRevenue: monthSummary.totalRevenue,
        monthProfit: monthSummary.profit,
        monthSalesCount: monthSales.length,
      },
      lowStock,
      recentOrders,
      topProducts,
      salesSummary: allSalesSummary, // resumen general de ventas físicas
      todaySales: todaySummary,
      yesterdaySales: yesterdaySummary,
      monthSales: monthSummary,
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
