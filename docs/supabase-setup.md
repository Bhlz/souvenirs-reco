# Supabase en este proyecto (Next.js)

Pasos mínimos para usar Supabase como Postgres administrado con Prisma y Next.js:

## 1) Crear proyecto y claves
- Tu proyecto ya existe en `https://fhquhjahqqfawwldhaek.supabase.co`.
- En `Project Settings → Database → Connection string → Node.js` copia la URL **connection pooling (pgbouncer) con SSL**. Para este host sería:
  - `DATABASE_URL="postgresql://<user>:<password>@db.fhquhjahqqfawwldhaek.supabase.co:6543/postgres?pgbouncer=true&sslmode=require"`
- Crea shadow DB (o usa el mismo cluster con schema shadow) y define:
  - `SHADOW_DATABASE_URL="postgresql://<user>:<password>@db.fhquhjahqqfawwldhaek.supabase.co:6543/postgres?pgbouncer=true&sslmode=require&schema=shadow"`

Claves API (si usas supabase-js):
- En `Project Settings → API` copia:
  - `SUPABASE_URL=https://fhquhjahqqfawwldhaek.supabase.co`
  - `SUPABASE_ANON_KEY=<anon>`
  - `SUPABASE_SERVICE_ROLE_KEY=<service_role>` (solo backend, no exponer en frontend)

## 2) Variables de entorno
En `.env.local` añade:
```
DATABASE_URL=...
SHADOW_DATABASE_URL=...
```
No subas estos valores a git; usa Supabase “Secrets” para despliegue o variables en tu hosting de Next.

## 3) Prisma (recomendado)
Si aún no lo tienes:
```bash
npm i prisma @prisma/client
npx prisma init --datasource-provider postgresql
```
Edita `prisma/schema.prisma` con el modelo (ver `docs/db-architecture.md`). Con Prisma 7+ el `DATABASE_URL` se configura en `prisma.config.ts` (ya incluido). Luego:
```bash
npx prisma migrate dev --name init_catalog_orders
npx prisma generate
```
Para producción, usa `npx prisma migrate deploy`.
Ya se incluye `prisma/schema.prisma` basado en la arquitectura propuesta; ajusta si tu modelo cambia.

## 4) Cliente y pooling en Next
En `lib/db.ts` (crearlo si no existe):
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```
Usa `prisma` en tus repositorios en lugar de `fs`.

### Cliente supabase-js (frontend/backend)
El proyecto ya incluye `lib/supabase.ts`:
```ts
import { getSupabaseBrowserClient, getSupabaseServiceRoleClient } from '@/lib/supabase';
// frontend o llamadas sin privilegios
const supabase = getSupabaseBrowserClient();
// backend con privilegios (no exponer service key)
const adminSupabase = getSupabaseServiceRoleClient();
```
Variables esperadas:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # solo backend
```

## 5) Migrar datos desde JSON
Escribe un script `scripts/import-json.ts` que lea `data/*.json` y cree productos/imágenes/SKUs en Supabase vía Prisma. Ejecuta una sola vez:
```bash
npx ts-node scripts/import-json.ts
```

## 6) Seguridad y operación
- **RLS**: no necesaria para acceso backend (Next API), pero actívalo si expones supabase-js en el cliente.
- **Roles**: usa el usuario de conexión default para app; reserva el “service_role” sólo para tareas administrativas.
- **Backups**: habilita PITR y verifica restauraciones periódicas.
- **Observabilidad**: en Supabase habilita logs y el panel de métricas; agrega alertas por conexiones y latency.

## 7) Cambios en el código
- Sustituye `lib/store.ts` por repositorios Prisma (productos, SKUs, órdenes, webhooks) con transacciones.
- Actualiza las rutas en `app/api/*` para leer/escribir en Supabase.
- Usa tipos generados de Prisma para consistencia en `lib/types.ts` o deriva los DTO desde los modelos.
