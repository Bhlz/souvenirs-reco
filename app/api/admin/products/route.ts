import { NextRequest } from 'next/server';
import { getAllProducts, setProduct, deleteProduct } from '@/lib/store';
import { Product } from '@/lib/types';

function ensureAuth(req: NextRequest) {
  const cookie = req.cookies.get('admin')?.value;
  if (cookie !== '1') throw new Error('unauthorized');
}

export async function GET(req: NextRequest) {
  try {
    ensureAuth(req);
    const products = await getAllProducts();
    return Response.json({ products });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureAuth(req);
    const p: Product = await req.json();
    if (!p.slug || !p.name) return new Response('Bad Request', { status: 400 });
    await setProduct(p);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    ensureAuth(req);
    const p: Product = await req.json();
    await setProduct(p);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    ensureAuth(req);
    const { slug } = await req.json();
    if (!slug) return new Response('Bad Request', { status: 400 });
    await deleteProduct(slug);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
