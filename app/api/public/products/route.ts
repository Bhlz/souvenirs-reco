import { getAllProducts } from '@/lib/store';
export async function GET() { const products = await getAllProducts(); return Response.json({ products }); }
