import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Tipo para representar una venta (compatible con el frontend existente)
export type Sale = {
  id: string;
  name: string;
  quantity: number;
  cost: number;    // costUnit en DB
  price: number;   // priceUnit en DB
  date: string;    // ISO string
  note?: string;
};

// Convertir registro de DB a tipo Sale
function dbToSale(record: Prisma.SaleGetPayload<{}>): Sale {
  return {
    id: record.id,
    name: record.name,
    quantity: record.quantity,
    cost: Number(record.costUnit),
    price: Number(record.priceUnit),
    date: record.date.toISOString(),
    note: record.note || undefined,
  };
}

// Obtener todas las ventas
export async function getSales(): Promise<Sale[]> {
  const records = await prisma.sale.findMany({
    orderBy: { date: 'desc' },
  });
  return records.map(dbToSale);
}

// Obtener ventas filtradas por rango de fechas
export async function getSalesByDateRange(start: Date, end: Date): Promise<Sale[]> {
  const records = await prisma.sale.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: 'desc' },
  });
  return records.map(dbToSale);
}

// Agregar una nueva venta
export async function addSale(sale: Omit<Sale, 'id'> & { id?: string }): Promise<Sale> {
  const record = await prisma.sale.create({
    data: {
      id: sale.id || undefined, // Prisma generará UUID si no se proporciona
      name: sale.name,
      quantity: sale.quantity,
      costUnit: new Prisma.Decimal(sale.cost),
      priceUnit: new Prisma.Decimal(sale.price),
      date: new Date(sale.date),
      note: sale.note || null,
    },
  });
  return dbToSale(record);
}

// Actualizar una venta existente
export async function updateSale(sale: Sale): Promise<Sale> {
  const record = await prisma.sale.update({
    where: { id: sale.id },
    data: {
      name: sale.name,
      quantity: sale.quantity,
      costUnit: new Prisma.Decimal(sale.cost),
      priceUnit: new Prisma.Decimal(sale.price),
      date: new Date(sale.date),
      note: sale.note || null,
    },
  });
  return dbToSale(record);
}

// Eliminar una venta
export async function deleteSale(id: string): Promise<void> {
  await prisma.sale.delete({
    where: { id },
  });
}

// Tipo para el resumen de ventas
export type SalesSummary = {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  totalUnits: number;
};

// Calcular resumen de ventas
export function summarizeSales(sales: Sale[]): SalesSummary {
  return sales.reduce(
    (acc, s) => {
      const revenue = s.price * s.quantity;
      const cost = s.cost * s.quantity;
      acc.totalRevenue += revenue;
      acc.totalCost += cost;
      acc.profit += revenue - cost;
      acc.totalUnits += s.quantity;
      return acc;
    },
    { totalRevenue: 0, totalCost: 0, profit: 0, totalUnits: 0 }
  );
}

// Filtrar ventas por fecha (helper function)
export function filterSalesByDate(sales: Sale[], start: Date, end: Date): Sale[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return sales.filter((s) => {
    const t = new Date(s.date).getTime();
    return t >= startMs && t <= endMs;
  });
}

// Obtener ventas de hoy
export async function getTodaySales(): Promise<Sale[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return getSalesByDateRange(startOfDay, endOfDay);
}

// Obtener ventas de ayer (para comparación)
export async function getYesterdaySales(): Promise<Sale[]> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
  const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
  return getSalesByDateRange(startOfDay, endOfDay);
}

// Obtener ventas del mes actual
export async function getCurrentMonthSales(): Promise<Sale[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return getSalesByDateRange(startOfMonth, endOfMonth);
}
