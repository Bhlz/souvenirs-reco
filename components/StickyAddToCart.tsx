'use client';
import { addToCart } from '@/lib/cart';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StickyAddToCart({ slug, price }: { slug: string; price: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'add'|'buy'|null>(null);
  const [qty, setQty] = useState(1);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 p-3 shadow-2xl md:hidden">
      <div className="container flex items-center justify-between gap-3">
        <div className="text-sm">Total: <strong>${price * qty} MXN</strong></div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={()=>setQty(q=>Math.max(1,q-1))}>–</button>
          <div className="w-10 text-center">{qty}</div>
          <button className="btn" onClick={()=>setQty(q=>q+1)}>+</button>
          <button className="btn-primary disabled:opacity-60" disabled={busy!==null} onClick={()=>{ setBusy('add'); addToCart(slug, qty); window.dispatchEvent(new Event('storage')); toast('Agregado al carrito'); setTimeout(()=>setBusy(null), 400); }}>
            {busy==='add' ? 'Agregando…' : 'Agregar'}
          </button>
          <button className="btn disabled:opacity-60" disabled={busy!==null} onClick={()=>{ setBusy('buy'); addToCart(slug, qty); window.dispatchEvent(new Event('storage')); router.push('/cart'); }}>
            {busy==='buy' ? 'Abriendo…' : 'Comprar ahora'}
          </button>
        </div>
      </div>
    </div>
  );
}
