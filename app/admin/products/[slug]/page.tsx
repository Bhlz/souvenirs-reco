import { notFound } from 'next/navigation';
import ProductForm from '../_components/ProductForm';
import { getProduct } from '@/lib/store';
import type { Product } from '@/lib/types';

// Prevent static generation - requires database at runtime
export const dynamic = 'force-dynamic';

export default async function EditProduct({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = (await getProduct(slug)) as Product | undefined;
  if (!product) return notFound();

  return <ProductForm initialProduct={product} mode="edit" />;
}
