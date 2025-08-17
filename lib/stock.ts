import { getAllProducts, saveProducts, getOrders } from '@/lib/store';

export async function debitStockForOrderIfNeeded(orderId: string) {
  const orders = await getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const debited = order?.raw?.stockDebited;
  if (debited) return;

  const products = await getAllProducts();
  for (const item of order.items) {
    const p = products.find(pp => pp.slug === item.slug);
    if (p) p.stock = Math.max(0, (p.stock ?? 0) - item.qty);
  }
  await saveProducts(products);
}
