# Arquitectura de base de datos para producción

## Objetivo y principios
- Garantizar consistencia fuerte (ACID), trazabilidad y auditoría para un e-commerce pequeño/mediano.
- Separar entornos (dev/stage/prod) con `DATABASE_URL` distintos; migraciones versionadas.
- Todo cambio de estado de negocio (stock, pagos, envíos) ocurre dentro de transacciones y queda auditado.

## Stack recomendado
- **Motor**: PostgreSQL administrado (Neon/Supabase/RDS) con punto-en-el-tiempo y copias automáticas.
- **Pooling**: pgbouncer/neon pooled para Next.js serverless; 5–10 conexiones mínimas reservadas.
- **ORM/migraciones**: Prisma (`prisma migrate`) para tipado estático en TS y generación de cliente.
- **Observabilidad**: `pg_stat_statements`, alertas por latencia/conexiones, dashboards de locks y vacuums.
- **Seguridad**: roles separados (`app_read`, `app_write`, `app_admin`), TLS obligatorio y secretos en `env`.

## Esquema propuesto (DDL de referencia)
```sql
-- Catálogo
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  base_price numeric(12,2) not null check (base_price > 0),
  category text,
  description text,
  rating numeric(2,1),
  reviews_count integer default 0 check (reviews_count >= 0),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id bigserial primary key,
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position integer not null default 0,
  is_primary boolean default false
);

create table product_options ( -- atributos visibles (ej. Talla, Color)
  id bigserial primary key,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  unique (product_id, lower(name))
);

create table product_option_values ( -- valores de cada atributo
  id bigserial primary key,
  option_id bigint not null references product_options(id) on delete cascade,
  value text not null,
  position integer not null default 0,
  unique (option_id, lower(value))
);

create table product_skus ( -- combinación concreta vendible
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku_code text unique, -- opcional para ERP
  price numeric(12,2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_sku_options ( -- vincula SKU con valores (Talla:M, Color:Rojo)
  sku_id uuid not null references product_skus(id) on delete cascade,
  option_value_id bigint not null references product_option_values(id) on delete cascade,
  primary key (sku_id, option_value_id)
);

create table product_bundles ( -- sugerencias/upsells
  product_id uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  primary key (product_id, related_product_id)
);

-- Pedidos
create type order_status as enum ('pending','approved','rejected','in_process','unknown');

create table orders (
  id uuid primary key default gen_random_uuid(),
  external_ref text,              -- orderId usado en Mercado Pago
  mp_preference_id text unique,
  mp_payment_id text,
  status order_status not null default 'pending',
  subtotal numeric(12,2) not null,
  discount numeric(12,2) not null default 0 check (discount >= 0),
  shipping numeric(12,2) not null default 0 check (shipping >= 0),
  total numeric(12,2) not null,
  currency char(3) not null default 'MXN',
  billing_name text,
  billing_email text,
  billing_phone text,
  shipping_address jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  sku_id uuid references product_skus(id),
  slug_snapshot text not null,
  name_snapshot text not null,
  price_snapshot numeric(12,2) not null,
  quantity integer not null check (quantity > 0)
);

create table payments (
  id bigserial primary key,
  order_id uuid not null references orders(id) unique,
  provider text not null, -- 'mercadopago' | 'paypal' | ...
  status text not null,
  raw jsonb,
  received_at timestamptz default now()
);

create table shipments (
  id bigserial primary key,
  order_id uuid not null references orders(id) unique,
  status text not null default 'pending', -- pending | shipped | delivered
  tracking text,
  carrier text,
  metadata jsonb,
  updated_at timestamptz not null default now()
);

create table webhook_events ( -- idempotencia y debugging
  id bigserial primary key,
  provider text not null,
  external_id text not null,
  status text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table audit_logs (
  id bigserial primary key,
  actor_id uuid references admin_users(id),
  action text not null,
  entity text not null,
  entity_id text,
  data jsonb,
  created_at timestamptz not null default now()
);
```

## Flujos críticos y consistencia
- **Publicar catálogo**: operaciones sobre producto + opciones + SKUs en una transacción; `updated_at` se refresca vía trigger.
- **Checkout**:
  1) Leer SKUs válidos y precios desde DB.  
  2) Abrir transacción, `SELECT ... FOR UPDATE` sobre SKUs involucrados, validar stock y descontar.  
  3) Crear `orders` + `order_items` con snapshot de precio/nombre + `payments(pending)`.  
  4) Confirmar; si falla webhook luego, la orden existe y es reconciliable.
- **Webhooks**: registrar en `webhook_events` y procesar idempotente; actualizar `payments` y `orders.status` dentro de transacción.
- **Devoluciones/ajustes**: usar `audit_logs` para cualquier cambio manual (stock, estado, factura).

## Operación y seguridad
- **Métricas**: conexiones activas, tiempo de bloqueo, ratio de errores; alertar si `connections > 80%` o `replica lag > 30s`.
- **Backups**: PITR + snapshot diaria; prueba de restore mensual; retención 30–90 días.
- **Accesos**: sólo `app_write` desde Next API routes; `app_read` para BI; `app_admin` reservado para migraciones/ETL.
- **Datos sensibles**: emails/teléfonos cifrados en tránsito (TLS) y restringidos vía `column-level privileges` si el proveedor lo soporta.

## Plan de adopción en este repo
1) Añadir Prisma (`npm i prisma @prisma/client`) y `prisma/schema.prisma` con el modelo anterior (puede simplificarse si se arranca con menos tablas).  
2) Definir `DATABASE_URL` y `SHADOW_DATABASE_URL` por entorno; crear `docker-compose` para dev si se desea.  
3) Ejecutar `npx prisma migrate dev --name init_catalog_orders`; validar client en `lib/db.ts` con pooling.  
4) Migrar datos de `data/*.json` a Postgres con un script `scripts/import-json.ts` que cree productos, imágenes, SKUs básicos.  
5) Reemplazar `lib/store.ts` por repositorios que usen Prisma y cubran: catálogo, stock, órdenes, pagos, webhooks.  
6) Ajustar rutas API (`/api/public/products`, `/api/admin/*`, `/api/checkout/*`, `/api/webhooks/mp`) para consumir los repositorios y transacciones.  
7) Añadir pruebas de integración mínimas para: checkout reserva stock, webhook idempotente, CRUD de catálogo.  
8) Configurar backups/alertas en el proveedor y documentar runbooks (restore, rotación de contraseñas, failover).  
9) Retirar dependencias de archivos JSON y bloquear escritura en producción para evitar divergencias.

## Notas de implementación rápida
- Usa `numeric(12,2)` para precios y evita cálculos en flotante; formatea en frontend con `Intl.NumberFormat`.
- Prefiere claves naturales en negocio (`slug`, `sku_code`) pero opera con UUIDs internos para FK.
- Si el tráfico es bajo pero el webhook es crítico, prioriza idempotencia y logging aunque agregue unas escrituras extra.
