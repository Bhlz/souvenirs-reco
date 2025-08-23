'use client';
import { useEffect, useState } from 'react';
import { cartTotal } from '@/lib/cart';

export default function FreeShippingBar() {
  const [amount, setAmount] = useState(0);
  const [min] = useState(299
  );

  useEffect(() => {
    let priceMap: Record<string, number> = {};
    async function load() {
      try {
        const res = await fetch('/api/public/price-map', { cache: 'no-store' });
        const data = await res.json();
        priceMap = data.map || {};
      } catch {}
      const handle = () => setAmount(cartTotal(slug => priceMap[slug] ?? 0));
      handle();
      window.addEventListener('storage', handle);
      return () => window.removeEventListener('storage', handle);
    }
    load();
  }, []);

  const missing = Math.max(0, min - amount);
  const progress = Math.min(100, Math.round((amount / min) * 100));

  return (
    <div className="bg-neutral-900 text-white">
      <div className="container py-2 text-sm">
        {missing > 0 ? (
          <div>
            Te faltan <strong>${missing}</strong> para envío <strong>GRATIS</strong>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-2 bg-accent" style={{width: `${progress}%`}}/>
            </div>
          </div>
        ) : (
          <div className="text-center">¡Felicidades! Tienes <strong>envío GRATIS</strong> en tu pedido 🎉</div>
        )}
      </div>
    </div>
  );
}
