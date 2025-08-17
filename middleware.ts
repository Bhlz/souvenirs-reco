import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const isAdminPath = url.pathname.startsWith('/admin');
  if (!isAdminPath) return NextResponse.next();

  if (url.pathname === '/admin/login') return NextResponse.next();

  const cookie = req.cookies.get('admin')?.value;
  if (cookie === '1') return NextResponse.next();

  url.pathname = '/admin/login';
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/admin/:path*'] };
