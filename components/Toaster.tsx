'use client';
import { useEffect, useState } from 'react';

export default function Toaster() {
  const [msg, setMsg] = useState<string|null>(null);
  useEffect(() => {
    const h = (e: any) => {
      setMsg(e.detail?.message || '');
      setTimeout(() => setMsg(null), 1800);
    };
    window.addEventListener('app:toast', h as any);
    return () => window.removeEventListener('app:toast', h as any);
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <div className="rounded-full bg-neutral-900 px-4 py-2 text-white shadow-xl">{msg}</div>
    </div>
  );
}
