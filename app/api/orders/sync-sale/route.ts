// app/api/orders/sync-sale/route.ts
// Endpoint para sincronizar ventas cuando el webhook no funciona
// Se llama desde la página de resultado cuando detecta un pago aprobado

import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
    try {
        const { paymentId, externalReference } = await req.json();

        if (!paymentId) {
            return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
        }

        // Verificar el pago directamente con MercadoPago
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
        const payment = await new Payment(client).get({ id: String(paymentId) });

        if (payment.status !== 'approved') {
            return NextResponse.json({ error: 'Payment not approved', status: payment.status }, { status: 400 });
        }

        const orderId = externalReference || payment.external_reference;
        if (!orderId) {
            return NextResponse.json({ error: 'No order reference found' }, { status: 400 });
        }

        // Buscar la orden
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Actualizar estado de la orden si es necesario
        if (order.status !== 'approved') {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'approved',
                    mpPaymentId: String(payment.id),
                },
            });
        }

        // Crear las ventas si no existen
        const paymentDate = payment.date_approved
            ? new Date(payment.date_approved as string)
            : new Date();

        let salesCreated = 0;

        for (const item of order.items) {
            // Verificar si ya existe un Sale para este item
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
                salesCreated++;
                console.log(`[sync-sale] Sale creado para item ${item.nameSnapshot}`);
            }
        }

        return NextResponse.json({
            ok: true,
            salesCreated,
            orderId: order.id,
            paymentDate: paymentDate.toISOString(),
        });
    } catch (e: any) {
        console.error('sync-sale error:', e);
        return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
    }
}
