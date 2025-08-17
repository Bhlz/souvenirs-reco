import { NextRequest } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { updateOrderByExternalRef, updateOrderByPreference } from '@/lib/store';
import { debitStockForOrderIfNeeded } from '@/lib/stock';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const url = new URL(req.url);
    const type = body?.type || url.searchParams.get('type') || body?.topic;
    const dataId = body?.data?.id || url.searchParams.get('data.id') || body?.id || body?.resource?.id;
    if (type === 'payment' && dataId) {
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
      const payment = new Payment(client);
      const res = await payment.get({ id: dataId });
      const status = (res?.status as string) || 'unknown';
      const externalRef = (res?.external_reference as string) || '';
      const prefId = (res?.metadata?.preference_id as string) || (res?.order?.id as string) || '';

      if (externalRef) {
        await updateOrderByExternalRef(externalRef, { status: status as any, paymentId: dataId, raw: res });
        if (status === 'approved') await debitStockForOrderIfNeeded(externalRef);
      } else if (prefId) {
        await updateOrderByPreference(prefId, { status: status as any, paymentId: dataId, raw: res });
      }
    } else if (dataId) {
      await updateOrderByPreference(String(dataId), { status: 'unknown', raw: body });
    }
  } catch (e) {
    console.error('webhook error', e);
  }
  return new Response('ok');
}

export async function GET(req: NextRequest) {
  return new Response('ok');
}
