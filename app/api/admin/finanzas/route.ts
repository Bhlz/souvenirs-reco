import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-auth';

async function ensureAuth(req: NextRequest) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const ok = await verifyAdminToken(token);
    if (!ok) throw new Error('unauthorized');
}

// Helper para convertir Decimal a número
const toNum = (val: any) => Number(val) || 0;

export async function GET(req: NextRequest) {
    try {
        await ensureAuth(req);

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '30d';

        // Calcular fechas según período
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let startDate: Date;
        switch (period) {
            case 'today':
                startDate = today;
                break;
            case '7d':
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'mtd': // Month to date
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case '30d':
            default:
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 30);
        }

        // Obtener datos
        const [sales, orders, todaySales, yesterdaySales] = await Promise.all([
            prisma.sale.findMany({
                where: { date: { gte: startDate } },
                orderBy: { date: 'desc' },
            }),
            prisma.order.findMany({
                where: { createdAt: { gte: startDate } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.sale.findMany({
                where: { date: { gte: today } },
            }),
            prisma.sale.findMany({
                where: { date: { gte: yesterday, lt: today } },
            }),
        ]);

        // ========== KPIs ==========

        // Ventas físicas
        const physicalRevenue = sales.reduce((sum, s) => sum + toNum(s.priceUnit) * s.quantity, 0);
        const physicalCost = sales.reduce((sum, s) => sum + toNum(s.costUnit) * s.quantity, 0);
        const physicalDiscounts = sales.reduce((sum, s) => sum + toNum(s.discount), 0);
        const physicalFees = sales.reduce((sum, s) => sum + toNum(s.paymentFee), 0);
        const physicalShipping = sales.reduce((sum, s) => sum + toNum(s.shippingCost), 0);
        const physicalPackaging = sales.reduce((sum, s) => sum + toNum(s.packagingCost), 0);

        // Órdenes online
        const onlineRevenue = orders.reduce((sum, o) => sum + toNum(o.total), 0);
        const onlineSubtotal = orders.reduce((sum, o) => sum + toNum(o.subtotal), 0);
        const onlineDiscounts = orders.reduce((sum, o) => sum + toNum(o.discount), 0);
        const onlineFees = orders.reduce((sum, o) => sum + toNum(o.paymentFee), 0);
        const onlineShippingCost = orders.reduce((sum, o) => sum + toNum(o.shippingCost), 0);
        const onlinePackaging = orders.reduce((sum, o) => sum + toNum(o.packagingCost), 0);
        const onlineRefunds = orders.reduce((sum, o) => sum + toNum(o.refundAmount), 0);

        // Totales combinados
        const totalGrossRevenue = physicalRevenue + onlineSubtotal;
        const totalDiscounts = physicalDiscounts + onlineDiscounts;
        const totalNetRevenue = totalGrossRevenue - totalDiscounts;
        const totalCOGS = physicalCost; // Para órdenes online necesitaríamos el costo de productos
        const totalFees = physicalFees + onlineFees;
        const totalShippingCost = physicalShipping + onlineShippingCost;
        const totalPackaging = physicalPackaging + onlinePackaging;
        const totalRefunds = onlineRefunds;

        // Utilidad bruta (Ventas - COGS)
        const grossProfit = totalNetRevenue - totalCOGS;
        const grossMargin = totalNetRevenue > 0 ? (grossProfit / totalNetRevenue * 100) : 0;

        // Contribución (Profit real por pedido)
        // Ventas - COGS - Fees - Envío - Empaque - Descuentos - Devoluciones
        const totalVariableCosts = totalCOGS + totalFees + totalShippingCost + totalPackaging;
        const contribution = totalNetRevenue - totalVariableCosts - totalRefunds;
        const contributionMargin = totalNetRevenue > 0 ? (contribution / totalNetRevenue * 100) : 0;

        // Ticket promedio (AOV)
        const totalTransactions = sales.length + orders.length;
        const aov = totalTransactions > 0 ? totalNetRevenue / totalTransactions : 0;

        // Comparación hoy vs ayer
        const todayRevenue = todaySales.reduce((sum, s) => sum + toNum(s.priceUnit) * s.quantity, 0);
        const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + toNum(s.priceUnit) * s.quantity, 0);
        const revenueChange = yesterdayRevenue > 0
            ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
            : todayRevenue > 0 ? '+100' : '0';

        // Devoluciones
        const refundedOrders = orders.filter(o => toNum(o.refundAmount) > 0);
        const refundRate = orders.length > 0 ? (refundedOrders.length / orders.length * 100) : 0;
        const pendingRefunds = orders.filter(o => o.refundStatus === 'pending').length;

        // Ventas por canal
        const physicalSalesCount = sales.filter(s => s.channel === 'physical').length;
        const onlineSalesCount = orders.length;

        return Response.json({
            period,

            // KPIs principales
            kpis: {
                netRevenue: totalNetRevenue,
                grossRevenue: totalGrossRevenue,
                transactions: totalTransactions,
                aov,
                grossProfit,
                grossMargin: grossMargin.toFixed(1),
                contribution,
                contributionMargin: contributionMargin.toFixed(1),
                revenueChange,
            },

            // Ventas desglosadas
            sales: {
                gross: totalGrossRevenue,
                discounts: totalDiscounts,
                net: totalNetRevenue,
                byChannel: {
                    physical: { count: physicalSalesCount, revenue: physicalRevenue },
                    online: { count: onlineSalesCount, revenue: onlineRevenue },
                },
            },

            // Costos variables
            costs: {
                cogs: totalCOGS,
                paymentFees: totalFees,
                shippingCosts: totalShippingCost,
                packaging: totalPackaging,
                total: totalVariableCosts,
            },

            // Devoluciones
            refunds: {
                amount: totalRefunds,
                rate: refundRate.toFixed(1),
                count: refundedOrders.length,
                pending: pendingRefunds,
            },

            // Payouts (simplificado)
            payouts: {
                received: totalNetRevenue - totalFees - totalRefunds,
                pending: totalFees, // Aproximación
            },

            // Datos para exportar
            rawSales: sales.map(s => ({
                id: s.id,
                date: s.date,
                name: s.name,
                quantity: s.quantity,
                revenue: toNum(s.priceUnit) * s.quantity,
                cost: toNum(s.costUnit) * s.quantity,
                channel: s.channel,
            })),

            rawOrders: orders.map(o => ({
                id: o.id,
                date: o.createdAt,
                total: toNum(o.total),
                status: o.status,
                refundAmount: toNum(o.refundAmount),
                refundStatus: o.refundStatus,
            })),

            updatedAt: Date.now(),
        });
    } catch (e) {
        if ((e as Error).message === 'unauthorized') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('[admin:finanzas]', e);
        return Response.json({ error: 'Error al cargar datos financieros' }, { status: 500 });
    }
}
