import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { Product } from '@/lib/types';

const decimalToNumber = (value?: Prisma.Decimal | null) =>
  value != null ? Number(value) : undefined;

const productInclude = {
  images: { orderBy: { position: 'asc' as const } },
  options: {
    include: { values: { orderBy: { position: 'asc' as const } } },
    orderBy: { position: 'asc' as const },
  },
  skus: {
    include: {
      options: {
        include: {
          optionValue: { include: { option: true } },
        },
      },
    },
  },
  bundles: {
    include: {
      relatedProduct: { select: { slug: true } },
    },
  },
} as const;

function productRecordToProduct(p: Prisma.ProductGetPayload<{ include: typeof productInclude }>): Product {
  const variantGroups = p.options.map((opt) => ({
    name: opt.name,
    values: opt.values.map((v) => v.value),
  }));

  const variantPriceMap: Record<string, number> = {};
  for (const sku of p.skus) {
    if (!sku.options.length) continue;
    const keyParts = sku.options
      .map((o) => ({
        name: o.optionValue.option.name,
        value: o.optionValue.value,
        position: o.optionValue.option.position,
      }))
      .sort((a, b) => a.position - b.position)
      .map((o) => `${o.name}:${o.value}`);
    const key = keyParts.join('|');
    variantPriceMap[key] = Number(sku.price);
  }

  const stock = p.skus.reduce((sum, s) => sum + s.stock, 0);

  return {
    slug: p.slug,
    name: p.name,
    price: Number(p.basePrice),
    images: p.images.map((img) => img.url),
    rating: decimalToNumber(p.rating),
    reviews: p.reviewsCount,
    category: p.category ?? undefined,
    description: p.description ?? undefined,
    stock: stock || undefined,
    variants: variantGroups.length ? variantGroups : undefined,
    variantPriceMap: Object.keys(variantPriceMap).length ? variantPriceMap : undefined,
    bundleSkus: p.bundles.map((b) => b.relatedProduct.slug),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({ include: productInclude });
  return products.map(productRecordToProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });
  return product ? productRecordToProduct(product) : undefined;
}

export async function getPriceMap(): Promise<Record<string, number>> {
  const products = await prisma.product.findMany({ select: { slug: true, basePrice: true } });
  return Object.fromEntries(products.map((p) => [p.slug, Number(p.basePrice)]));
}

type UpsertProductInput = Product;

export async function setProduct(raw: UpsertProductInput) {
  const price = Number(raw.price || 0);
  const isNew = !(await prisma.product.findUnique({ where: { slug: raw.slug } }));

  await prisma.$transaction(async (tx) => {
    let productId: string;

    if (isNew) {
      const created = await tx.product.create({
        data: {
          slug: raw.slug,
          name: raw.name,
          basePrice: new Prisma.Decimal(price),
          category: raw.category,
          description: raw.description,
          rating: raw.rating != null ? new Prisma.Decimal(raw.rating) : null,
          reviewsCount: raw.reviews ?? 0,
          isActive: true,
        },
      });
      productId = created.id;
    } else {
      const current = await tx.product.findUniqueOrThrow({ where: { slug: raw.slug } });
      productId = current.id;
      // Limpieza para re-crear relaciones (más simple que upsert anidado complejo)
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productSkuOption.deleteMany({ where: { sku: { productId } } });
      await tx.productSku.deleteMany({ where: { productId } });
      await tx.productOptionValue.deleteMany({ where: { option: { productId } } });
      await tx.productOption.deleteMany({ where: { productId } });
      await tx.productBundle.deleteMany({
        where: { OR: [{ productId }, { relatedProductId: productId }] },
      });
      await tx.product.update({
        where: { id: productId },
        data: {
          slug: raw.slug,
          name: raw.name,
          basePrice: new Prisma.Decimal(price),
          category: raw.category,
          description: raw.description,
          rating: raw.rating != null ? new Prisma.Decimal(raw.rating) : null,
          reviewsCount: raw.reviews ?? 0,
          isActive: true,
        },
      });
    }

    // Imágenes
    if (raw.images?.length) {
      await tx.productImage.createMany({
        data: raw.images.map((url, idx) => ({
          productId,
          url,
          position: idx,
          isPrimary: idx === 0,
        })),
      });
    }

    // Opciones y valores
    const optionValueMap = new Map<string, bigint>();
    if (raw.variants?.length) {
      for (const [optIndex, opt] of raw.variants.entries()) {
        const option = await tx.productOption.create({
          data: {
            productId,
            name: opt.name,
            position: optIndex,
          },
        });
        for (const [valIndex, val] of opt.values.entries()) {
          const value = await tx.productOptionValue.create({
            data: {
              optionId: option.id,
              value: val,
              position: valIndex,
            },
          });
          optionValueMap.set(`${opt.name}:${val}`, value.id);
        }
      }
    }

    // SKUs
    const hasVariantPrices = raw.variantPriceMap && Object.keys(raw.variantPriceMap).length > 0;
    if (hasVariantPrices && optionValueMap.size > 0) {
      for (const [key, skuPrice] of Object.entries(raw.variantPriceMap!)) {
        const parts = key.split('|').map((k) => k.trim()).filter(Boolean);
        const optionValueIds: bigint[] = [];
        for (const part of parts) {
          const id = optionValueMap.get(part);
          if (id != null) optionValueIds.push(id);
        }
        const sku = await tx.productSku.create({
          data: {
            productId,
            price: new Prisma.Decimal(Number(skuPrice)),
            stock: raw.stock ?? 0,
            isActive: true,
          },
        });
        if (optionValueIds.length) {
          await tx.productSkuOption.createMany({
            data: optionValueIds.map((optionValueId) => ({
              skuId: sku.id,
              optionValueId,
            })),
          });
        }
      }
    } else {
      // SKU base sin variantes
      await tx.productSku.create({
        data: {
          productId,
          price: new Prisma.Decimal(price),
          stock: raw.stock ?? 0,
          isActive: true,
        },
      });
    }

    // Bundles
    if (raw.bundleSkus?.length) {
      const related = await tx.product.findMany({
        where: { slug: { in: raw.bundleSkus } },
        select: { id: true, slug: true },
      });
      await tx.productBundle.createMany({
        data: related.map((r) => ({
          productId,
          relatedProductId: r.id,
        })),
      });
    }
  });
}

export async function deleteProduct(slug: string) {
  await prisma.product.delete({ where: { slug } });
}

export type Order = {
  id: string;
  preferenceId: string;
  items: { slug: string; name?: string; qty: number; price: number }[];
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_process' | 'unknown';
  paymentId?: string;
  billing?: { name?: string; email?: string; phone?: string; rfc?: string };
  raw?: any;
  shipmentInfo?: { status: 'pending' | 'shipped' | 'delivered'; tracking?: string; carrier?: string };
  invoice?: { number?: string; url?: string };
};

export async function createOrder(o: Order) {
  const computedSubtotal = o.items.reduce((sum, it) => sum + it.price * it.qty, 0);

  await prisma.order.create({
    data: {
      id: o.id,
      externalRef: o.id,
      mpPreferenceId: o.preferenceId,
      mpPaymentId: o.paymentId ?? null,
      status: o.status,
      subtotal: new Prisma.Decimal(o.subtotal ?? computedSubtotal),
      discount: new Prisma.Decimal(o.discount ?? 0),
      shipping: new Prisma.Decimal(o.shipping ?? 0),
      total: new Prisma.Decimal(o.total),
      currency: 'MXN',
      billingName: o.billing?.name ?? null,
      billingEmail: o.billing?.email ?? null,
      billingPhone: o.billing?.phone ?? null,
      raw: o.raw ?? {},
      items: {
        create: o.items.map((it) => ({
          slugSnapshot: it.slug,
          nameSnapshot: it.name ?? it.slug,
          priceSnapshot: new Prisma.Decimal(it.price),
          quantity: it.qty,
        })),
      },
      shipment: o.shipmentInfo
        ? {
          create: {
            status: o.shipmentInfo.status,
            tracking: o.shipmentInfo.tracking,
            carrier: o.shipmentInfo.carrier,
          },
        }
        : undefined,
      invoice: o.invoice ?? null,
    },
  });
}

export async function updateOrderByPreference(preferenceId: string, patch: Partial<Order>) {
  await prisma.order.update({
    where: { mpPreferenceId: preferenceId },
    data: {
      status: patch.status,
      mpPaymentId: patch.paymentId ?? undefined,
      raw: patch.raw as Prisma.InputJsonValue | undefined,
      invoice: patch.invoice as Prisma.InputJsonValue | undefined,
      shipment: patch.shipmentInfo
        ? {
          upsert: {
            create: {
              status: patch.shipmentInfo.status,
              tracking: patch.shipmentInfo.tracking,
              carrier: patch.shipmentInfo.carrier,
            },
            update: {
              status: patch.shipmentInfo.status,
              tracking: patch.shipmentInfo.tracking,
              carrier: patch.shipmentInfo.carrier,
            },
          },
        }
        : undefined,
    },
  });
}

export async function updateOrderByExternalRef(orderId: string, patch: Partial<Order>) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: patch.status,
      mpPaymentId: patch.paymentId ?? undefined,
      invoice: patch.invoice as Prisma.InputJsonValue | undefined,
      shipment: patch.shipmentInfo
        ? {
          upsert: {
            create: {
              status: patch.shipmentInfo.status,
              tracking: patch.shipmentInfo.tracking,
              carrier: patch.shipmentInfo.carrier,
            },
            update: {
              status: patch.shipmentInfo.status,
              tracking: patch.shipmentInfo.tracking,
              carrier: patch.shipmentInfo.carrier,
            },
          },
        }
        : undefined,
    },
  });
}

export async function getOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      shipment: true,
      payment: true,
    },
  });

  return orders.map((o) => ({
    id: o.id,
    preferenceId: o.mpPreferenceId || '',
    items: o.items.map((it) => ({
      slug: it.slugSnapshot,
      name: it.nameSnapshot,
      qty: it.quantity,
      price: Number(it.priceSnapshot),
    })),
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    shipping: Number(o.shipping),
    total: Number(o.total),
    status: o.status as Order['status'],
    paymentId: o.mpPaymentId ?? undefined,
    billing: {
      name: o.billingName ?? undefined,
      email: o.billingEmail ?? undefined,
      phone: o.billingPhone ?? undefined,
    },
    raw: o.raw ?? undefined,
    shipmentInfo: o.shipment
      ? {
        status: (o.shipment.status as any) ?? 'pending',
        tracking: o.shipment.tracking ?? undefined,
        carrier: o.shipment.carrier ?? undefined,
      }
      : undefined,
    invoice: (o.invoice as any) ?? undefined,
    createdAt: o.createdAt,
  }));
}
