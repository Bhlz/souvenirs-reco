import { NextRequest } from 'next/server';
import { getAllProducts, setProduct, deleteProduct } from '@/lib/store';
import { Product } from '@/lib/types';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';

async function ensureAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminToken(token);
  if (!ok) throw new Error('unauthorized');
}

const normalizeList = (value?: (string | null | undefined)[]) =>
  (value ?? [])
    .map((u) => (u ?? '').toString().trim())
    .filter(Boolean)
    .filter((u, idx, arr) => arr.indexOf(u) === idx);

function normalizeProductInput(raw: any): Product {
  const variants = Array.isArray(raw?.variants)
    ? raw.variants
        .map((v: any) => ({
          name: (v?.name ?? '').toString().trim(),
          values: normalizeList(v?.values),
        }))
        .filter((v: any) => v.name && v.values.length)
    : undefined;

  const bundleSkus = normalizeList(Array.isArray(raw?.bundleSkus) ? raw.bundleSkus : []);

  const variantPriceMap = raw?.variantPriceMap
    ? Object.fromEntries(
        Object.entries(raw.variantPriceMap).map(([k, v]) => [k, Number(v)])
      )
    : undefined;

  return {
    slug: (raw?.slug ?? '').toString().trim(),
    name: (raw?.name ?? '').toString().trim(),
    price: Number(raw?.price ?? 0),
    images: normalizeList(Array.isArray(raw?.images) ? raw.images : []),
    rating: raw?.rating !== undefined ? Number(raw.rating) : undefined,
    reviews: raw?.reviews !== undefined ? Number(raw.reviews) : undefined,
    category: raw?.category ? raw.category.toString().trim() : undefined,
    description: raw?.description ? raw.description.toString().trim() : undefined,
    stock: raw?.stock !== undefined ? Number(raw.stock) : undefined,
    variants: variants?.length ? variants : undefined,
    bundleSkus,
    variantPriceMap,
  };
}

const isValid = (p: Product) => p.slug && p.name && (p.images?.length ?? 0) > 0;

export async function GET(req: NextRequest) {
  try {
    await ensureAuth(req);
    const products = await getAllProducts();
    return Response.json({ products });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAuth(req);
    const p = normalizeProductInput(await req.json());
    if (!isValid(p)) return Response.json({ error: 'Faltan campos obligatorios o imágenes' }, { status: 400 });
    await setProduct(p);
    return Response.json({ ok: true });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[admin:products:POST]', e);
    return Response.json({ error: 'Error al guardar producto' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureAuth(req);
    const p = normalizeProductInput(await req.json());
    if (!isValid(p)) return Response.json({ error: 'Faltan campos obligatorios o imágenes' }, { status: 400 });
    await setProduct(p);
    return Response.json({ ok: true });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[admin:products:PUT]', e);
    return Response.json({ error: 'Error al guardar producto' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureAuth(req);
    const { slug } = await req.json();
    if (!slug) return new Response('Bad Request', { status: 400 });
    await deleteProduct(slug);
    return Response.json({ ok: true });
  } catch (e) {
    if ((e as Error).message === 'unauthorized') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[admin:products:DELETE]', e);
    return Response.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
