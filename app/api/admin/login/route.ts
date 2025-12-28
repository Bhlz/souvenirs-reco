import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, createAdminToken, isAdminAuthConfigured } from '@/lib/admin-auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pass = (body?.password ?? '').toString().trim();
  const expected = (process.env.ADMIN_PASSWORD ?? '').toString().trim();

  if (!expected || !isAdminAuthConfigured()) {
    return new Response(
      JSON.stringify({ ok: false, message: 'ADMIN_PASSWORD no configurado o sin secreto' }),
      { status: 500 }
    );
  }
  if (!pass || pass !== expected) {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid password' }), { status: 401 });
  }

  const token = await createAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12,
  });
  return res;
}
