import { prisma } from '@/lib/db';

export async function debitStockForOrderIfNeeded(orderId: string) {
  // Find the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  // Check if stock was already debited (stored in raw JSON)
  const raw = order.raw as Record<string, unknown> | null;
  if (raw?.stockDebited) return;

  // Debit stock for each item from SKU
  for (const item of order.items) {
    if (item.skuId) {
      // Get current stock from SKU
      const sku = await prisma.productSku.findUnique({
        where: { id: item.skuId },
        select: { stock: true },
      });
      if (sku) {
        await prisma.productSku.update({
          where: { id: item.skuId },
          data: {
            stock: Math.max(0, sku.stock - item.quantity),
          },
        });
      }
    }
  }

  // Mark as debited
  await prisma.order.update({
    where: { id: orderId },
    data: {
      raw: { ...(raw || {}), stockDebited: true },
    },
  });
}
