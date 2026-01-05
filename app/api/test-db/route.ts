import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Intenta una query muy simple
        const count = await prisma.product.count();

        // Muestra también parte de la configuración (ocultando password)
        const dbUrl = process.env.DATABASE_URL || 'No definida';
        const sanitizedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');

        return NextResponse.json({
            status: 'ok',
            message: 'Conexión exitosa a la base de datos',
            productCount: count,
            connectionString: sanitizedUrl,
            env: process.env.NODE_ENV
        });
    } catch (error: any) {
        console.error('Test DB Error:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Fallo la conexión a la base de datos',
            error: error.message,
            code: error.code,
            meta: error.meta,
            name: error.name
        }, { status: 500 });
    }
}
