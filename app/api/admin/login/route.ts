import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pass = (body?.password ?? '').toString().trim();
  const expected = (process.env.ADMIN_PASSWORD ?? '').toString().trim();

  if (!expected) {
    return new Response(JSON.stringify({ ok: false, message: 'ADMIN_PASSWORD no configurado' }), { status: 500 });
  }
  if (!pass || pass !== expected) {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid password' }), { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin', '1', { httpOnly: true, path: '/', sameSite: 'lax' });
  return res;
}
