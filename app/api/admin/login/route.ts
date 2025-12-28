import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, createAdminToken, getAdminAuthConfig } from '@/lib/admin-auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pass = (body?.password ?? '').toString().trim();
  const { password, issues, blockingIssue } = getAdminAuthConfig();

  if (blockingIssue) {
    return new Response(
      JSON.stringify({ ok: false, message: blockingIssue }),
      { status: 500 }
    );
  }

  if (!pass || pass !== password) {
    return new Response(JSON.stringify({ ok: false, message: 'Contraseña incorrecta' }), { status: 401 });
  }

  try {
    const token = await createAdminToken();
    const res = NextResponse.json({ ok: true, warnings: issues });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (err) {
    console.error('[admin:login] token error', err);
    return new Response(JSON.stringify({ ok: false, message: 'No se pudo generar sesión segura' }), { status: 500 });
  }
}
