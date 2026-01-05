import { getAllProducts, getOrders } from '@/lib/store';
import { getSales, summarizeSales } from '@/lib/sales';
import RealtimeDashboard from './_components/RealtimeDashboard';

// Prevent static generation - requires database at runtime
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
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

  const initial = {
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
  };

  return <RealtimeDashboard initial={initial} />;
}
