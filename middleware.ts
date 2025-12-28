import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken, isAdminAuthConfigured } from '@/lib/admin-auth';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const isAdminPath = url.pathname.startsWith('/admin');
  if (!isAdminPath) return NextResponse.next();

  if (url.pathname === '/admin/login') return NextResponse.next();

  if (!isAdminAuthConfigured()) {
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminToken(token);
  if (ok) return NextResponse.next();

  url.pathname = '/admin/login';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/admin/:path*'] };
