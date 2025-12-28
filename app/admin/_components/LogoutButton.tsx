'use client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/lib/toast';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/logout', { method: 'POST' });
    setLoading(false);
    if (!res.ok) {
      toast('No se pudo cerrar sesión');
      return;
    }
    router.push('/admin/login');
  };

  return (
    <button className="btn bg-white text-slate-700 hover:bg-slate-100" onClick={logout} disabled={loading}>
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? 'Saliendo...' : 'Salir'}
    </button>
  );
}
