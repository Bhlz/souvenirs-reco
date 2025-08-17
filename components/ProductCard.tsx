import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';

export default function ProductCard({ p }: { p: Product }) {
  return (
    <Link href={`/product/${p.slug}`} className="group card p-0 overflow-hidden">
      <div className="relative aspect-square">
        <Image src={p.images[0]} alt={p.name} fill className="object-cover transition group-hover:scale-105"/>
      </div>
      <div className="p-4">
        <div className="font-semibold line-clamp-1">{p.name}</div>
        <div className="mt-1 text-sm text-neutral-600">${p.price} MXN</div>
      </div>
    </Link>
  );
}
