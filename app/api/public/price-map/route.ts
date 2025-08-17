import { getPriceMap } from '@/lib/store';
export async function GET() { const map = await getPriceMap(); return Response.json({ map }); }
