'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })});
    const body = await res.json().catch(() => ({}));
    if (res.ok) router.push('/admin/products');
    else setErr(body.message || 'Contraseña incorrecta o ADMIN_PASSWORD sin configurar');
  }
  return (
    <div className="container py-12 max-w-md">
      <h1 className="text-2xl font-bold">Acceso administrador</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full">Entrar</button>
      </form>
    </div>
  );
}
