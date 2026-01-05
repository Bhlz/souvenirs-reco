import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // En build time (static generation) esto está bien, pero en runtime fallará.
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: DATABASE_URL is missing in environment variables.');
  }
}


// Create a PostgreSQL connection pool
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Usa un singleton en desarrollo para evitar conexiones múltiples al recargar.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
