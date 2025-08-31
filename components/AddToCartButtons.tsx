'use client';
import { addToCart } from '@/lib/cart';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddToCartButtons({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'add'|'buy'|null>(null);

  function add() {
    setBusy('add');
    addToCart(slug, 1);              // ← dispara cart:bump + cart:changed
    toast('Agregado al carrito');
    setTimeout(()=> setBusy(null), 400);
  }

  function buyNow() {
    setBusy('buy');
    addToCart(slug, 1);              // asegura que exista en el carrito
    toast('Listo, revisa tu carrito');
    router.push('/cart');
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button className="btn-primary disabled:opacity-60" disabled={busy!==null} onClick={add}>
        {busy==='add' ? 'Agregando…' : 'Agregar al carrito'}
      </button>
      <button className="btn disabled:opacity-60" disabled={busy!==null} onClick={buyNow}>
        {busy==='buy' ? 'Abriendo carrito…' : 'Comprar ahora'}
      </button>
    </div>
  );
}
