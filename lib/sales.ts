import fs from 'fs/promises';
import path from 'path';

export type Sale = {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  price: number;
  date: string; // ISO string
  note?: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function ensureFile() {
  await ensureDataDir();
  try {
    await fs.stat(SALES_FILE);
  } catch {
    await fs.writeFile(SALES_FILE, JSON.stringify({ sales: [] }, null, 2), 'utf-8');
  }
}

export async function getSales(): Promise<Sale[]> {
  await ensureFile();
  const raw = JSON.parse(await fs.readFile(SALES_FILE, 'utf-8'));
  return (raw.sales || []) as Sale[];
}

export async function addSale(sale: Sale) {
  await ensureFile();
  const data = JSON.parse(await fs.readFile(SALES_FILE, 'utf-8'));
  data.sales.push(sale);
  await fs.writeFile(SALES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function updateSale(sale: Sale) {
  await ensureFile();
  const data = JSON.parse(await fs.readFile(SALES_FILE, 'utf-8'));
  const idx = (data.sales || []).findIndex((s: Sale) => s.id === sale.id);
  if (idx >= 0) {
    data.sales[idx] = sale;
  } else {
    data.sales.push(sale);
  }
  await fs.writeFile(SALES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export type SalesSummary = {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  totalUnits: number;
};

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

export function filterSalesByDate(sales: Sale[], start: Date, end: Date) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return sales.filter((s) => {
    const t = new Date(s.date).getTime();
    return t >= startMs && t <= endMs;
  });
}
