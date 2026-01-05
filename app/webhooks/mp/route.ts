// app/webhooks/mp/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Helper para mapear estado de MP a nuestro enum
const mapStatus = (s?: string) =>
  (['approved', 'rejected', 'in_process', 'pending'].includes(s || '') ? s : 'unknown') as
  'approved' | 'rejected' | 'in_process' | 'pending' | 'unknown';

export async function POST(req: Request) {
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

  let json: any = null;
  try { json = await req.json(); } catch { }

  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? json?.type ?? json?.action;
  const id = url.searchParams.get('data.id') ?? json?.data?.id ?? json?.id;

  try {
    // ========== Registrar evento en WebhookEvent para auditoría ==========
    if (id) {
      await prisma.webhookEvent.upsert({
        where: {
          provider_externalId: {
            provider: 'mercadopago',
            externalId: String(id),
          },
        },
        create: {
          provider: 'mercadopago',
          externalId: String(id),
          status: type || 'unknown',
          payload: json ?? {},
        },
        update: {
          status: type || 'unknown',
          payload: json ?? {},
        },
      });
    }

    // ========== Procesar notificación de pago ==========
    if (type === 'payment' && id) {
      const payment = await new Payment(client).get({ id: String(id) });

      const status = mapStatus(payment.status as string);
      const preferenceId = (payment as any).preference_id as string | undefined;
      const externalRef = payment.external_reference as string | undefined;

      // Extraer comisión de MP (fee_details)
      const feeDetails = (payment as any).fee_details as Array<{ type: string; amount: number }> | undefined;
      const mpFee = feeDetails?.reduce((sum, fee) => sum + (fee.amount || 0), 0) ?? 0;

      // Datos del pagador
      const payer = payment.payer as any;

      // ========== Actualizar orden ==========
      const orderUpdateData: any = {
        status,
        mpPaymentId: String(payment.id),
        raw: payment as any,
        paymentFee: new Prisma.Decimal(mpFee),
      };

      // Actualizar datos de billing si están disponibles en el pago
      if (payer) {
        if (payer.first_name || payer.last_name) {
          orderUpdateData.billingName = `${payer.first_name || ''} ${payer.last_name || ''}`.trim();
        }
        if (payer.email) {
          orderUpdateData.billingEmail = payer.email;
        }
        if (payer.phone?.number) {
          orderUpdateData.billingPhone = payer.phone.number;
        }
      }

      // Actualizar por external_reference (orderId)
      if (externalRef) {
        try {
          const order = await prisma.order.update({
            where: { id: externalRef },
            data: orderUpdateData,
            include: { items: true }, // Incluir items para crear Sales
          });

          // Crear o actualizar registro de Payment
          await prisma.payment.upsert({
            where: { orderId: order.id },
            create: {
              orderId: order.id,
              provider: 'mercadopago',
              status: status,
              raw: payment as any,
            },
            update: {
              status: status,
              raw: payment as any,
            },
          });

          // ========== Crear registros en Sale cuando el pago es APROBADO ==========
          if (status === 'approved' && order.items.length > 0) {
            const paymentDate = payment.date_approved
              ? new Date(payment.date_approved as string)
              : new Date();

            // Crear una venta por cada item de la orden
            for (const item of order.items) {
              // Verificar si ya existe un Sale para este item (evitar duplicados)
              const existingSale = await prisma.sale.findFirst({
                where: {
                  note: { contains: `MP:${order.id}:${item.id}` },
                },
              });

              if (!existingSale) {
                await prisma.sale.create({
                  data: {
                    name: item.nameSnapshot,
                    quantity: item.quantity,
                    costUnit: new Prisma.Decimal(0), // Costo se puede actualizar manualmente
                    priceUnit: item.priceSnapshot,
                    date: paymentDate,
                    note: `Venta online MP - Orden #${order.id.slice(0, 8)} | MP:${order.id}:${item.id}`,
                    channel: 'online',
                  },
                });
              }
            }
          }
        } catch (e) {
          console.warn('No se pudo actualizar orden por externalRef:', externalRef, e);
        }
      }

      // Actualizar por preferenceId (fallback)
      if (preferenceId && !externalRef) {
        try {
          const order = await prisma.order.update({
            where: { mpPreferenceId: preferenceId },
            data: orderUpdateData,
            include: { items: true },
          });

          // Crear o actualizar registro de Payment
          await prisma.payment.upsert({
            where: { orderId: order.id },
            create: {
              orderId: order.id,
              provider: 'mercadopago',
              status: status,
              raw: payment as any,
            },
            update: {
              status: status,
              raw: payment as any,
            },
          });

          // Crear registros en Sale cuando aprobado
          if (status === 'approved' && order.items.length > 0) {
            const paymentDate = payment.date_approved
              ? new Date(payment.date_approved as string)
              : new Date();

            for (const item of order.items) {
              const existingSale = await prisma.sale.findFirst({
                where: {
                  note: { contains: `MP:${order.id}:${item.id}` },
                },
              });

              if (!existingSale) {
                await prisma.sale.create({
                  data: {
                    name: item.nameSnapshot,
                    quantity: item.quantity,
                    costUnit: new Prisma.Decimal(0),
                    priceUnit: item.priceSnapshot,
                    date: paymentDate,
                    note: `Venta online MP - Orden #${order.id.slice(0, 8)} | MP:${order.id}:${item.id}`,
                    channel: 'online',
                  },
                });
              }
            }
          }
        } catch (e) {
          console.warn('No se pudo actualizar orden por preferenceId:', preferenceId, e);
        }
      }

      return NextResponse.json({ ok: true });
    }

    // ========== Procesar notificación de merchant_order ==========
    if (type === 'merchant_order' && id) {
      const moRes = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      }).then(r => r.json());

      const preferenceId = moRes?.preference_id as string | undefined;
      const pmt = moRes?.payments?.[0];
      const status = mapStatus(pmt?.status as string);

      if (preferenceId) {
        try {
          const order = await prisma.order.update({
            where: { mpPreferenceId: preferenceId },
            data: {
              status,
              mpPaymentId: pmt?.id ? String(pmt.id) : undefined,
              raw: moRes,
            },
          });

          // Crear o actualizar registro de Payment
          if (pmt?.id) {
            await prisma.payment.upsert({
              where: { orderId: order.id },
              create: {
                orderId: order.id,
                provider: 'mercadopago',
                status: status,
                raw: moRes,
              },
              update: {
                status: status,
                raw: moRes,
              },
            });
          }
        } catch (e) {
          console.warn('No se pudo actualizar orden por merchant_order:', preferenceId, e);
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Si no reconocemos el mensaje, responde 200 para evitar reintentos masivos
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('MP webhook error', e);
    // responde 200 igualmente (MP reintenta varias veces)
    return NextResponse.json({ ok: false });
  }
}
