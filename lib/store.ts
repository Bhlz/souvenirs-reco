import fs from 'fs/promises';
import path from 'path';
import { Product } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

export async function seedIfMissing() {
  await ensureDataDir();
  try { await fs.stat(STORE_FILE); } catch {
    const seed: Product[] = [
      {
        slug: 'alebrije-oaxaca',
        name: 'Alebrije artesanal de Oaxaca',
        price: 749,
        images: [
          'https://images.unsplash.com/photo-1545249390-6bdfa286032f?q=80&w=1200',
          'https://images.unsplash.com/photo-1582582494700-85d75390b815?q=80&w=1200',
        ],
        rating: 4.9,
        reviews: 128,
        category: 'Artesanías',
        description: 'Hecho y pintado a mano. Incluye certificado de autenticidad y empaque para regalo.',
        stock: 12,
        variants: [{ name: 'Tamaño', values: ['Chico', 'Mediano', 'Grande'] }],
        bundleSkus: ['taza-talavera', 'rebozo-artesanal'],
      },
      {
        slug: 'taza-talavera',
        name: 'Taza de Talavera (Puebla)',
        price: 399,
        images: ['https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?q=80&w=1200'],
        rating: 4.8,
        reviews: 212,
        category: 'Hogar',
        description: 'Pieza de Talavera auténtica, apta para bebidas calientes, ideal para regalo.',
        stock: 25,
      },
      {
        slug: 'rebozo-artesanal',
        name: 'Rebozo artesanal (Tenancingo)',
        price: 899,
        images: ['https://images.unsplash.com/photo-1589739907960-69ade1678e3f?q=80&w=1200'],
        rating: 4.7,
        reviews: 76,
        category: 'Moda',
        description: 'Tejido en telar de cintura, suave y resistente. Incluye bolsa protectora.',
        stock: 7,
      },
      {
        slug: 'sombrero-charro',
        name: 'Sombrero charro (Jalisco)',
        price: 1199,
        images: ['https://images.unsplash.com/photo-1519682577862-22b62b24e493?q=80&w=1200'],
        rating: 4.6,
        reviews: 54,
        category: 'Moda',
        description: 'Hecho a mano, materiales premium. Talla ajustable.',
        stock: 5,
      },
    ];
    await fs.writeFile(STORE_FILE, JSON.stringify({ products: seed }, null, 2), 'utf-8');
  }
  try { await fs.stat(ORDERS_FILE); } catch { await fs.writeFile(ORDERS_FILE, JSON.stringify({ orders: [] }, null, 2), 'utf-8'); }
}

export async function getAllProducts() {
  await seedIfMissing();
  const raw = JSON.parse(await fs.readFile(STORE_FILE, 'utf-8'));
  return raw.products as Product[];
}

export async function getProduct(slug: string) {
  const all = await getAllProducts();
  return all.find(p => p.slug === slug);
}

export async function saveProducts(products: Product[]) {
  await ensureDataDir();
  await fs.writeFile(STORE_FILE, JSON.stringify({ products }, null, 2), 'utf-8');
}

export async function setProduct(p: Product) {
  const all = await getAllProducts();
  const i = all.findIndex(x => x.slug === p.slug);
  if (i >= 0) all[i] = p; else all.push(p);
  await saveProducts(all);
}

export async function deleteProduct(slug: string) {
  const all = await getAllProducts();
  await saveProducts(all.filter(p => p.slug !== slug));
}

export async function getPriceMap(): Promise<Record<string, number>> {
  const all = await getAllProducts();
  return Object.fromEntries(all.map(p => [p.slug, p.price]));
}

export type Order = {
  id: string;
  preferenceId: string;
  items: { slug: string; qty: number; price: number }[];
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_process' | 'unknown';
  paymentId?: string;
  raw?: any;
  shipment?: { status: 'pending'|'shipped'|'delivered', tracking?: string, carrier?: string };
  invoice?: { number?: string, url?: string };
};

export async function createOrder(o: Order) {
  await seedIfMissing();
  const data = JSON.parse(await fs.readFile(ORDERS_FILE, 'utf-8'));
  data.orders.push(o);
  await fs.writeFile(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function updateOrderByPreference(preferenceId: string, patch: Partial<Order>) {
  const data = JSON.parse(await fs.readFile(ORDERS_FILE, 'utf-8'));
  const idx = data.orders.findIndex((o: Order) => o.preferenceId === preferenceId);
  if (idx >= 0) {
    data.orders[idx] = { ...data.orders[idx], ...patch };
    await fs.writeFile(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export async function updateOrderByExternalRef(orderId: string, patch: Partial<Order>) {
  const data = JSON.parse(await fs.readFile(ORDERS_FILE, 'utf-8'));
  const idx = data.orders.findIndex((o: Order) => o.id === orderId);
  if (idx >= 0) {
    data.orders[idx] = { ...data.orders[idx], ...patch };
    await fs.writeFile(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export async function getOrders() {
  await seedIfMissing();
  const data = JSON.parse(await fs.readFile(ORDERS_FILE, 'utf-8'));
  return data.orders as Order[];
}
