import { type NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/login', '/register', '/otp', '/verify-email', '/forgot-password', '/reset-password', '/health'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow root landing page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // The actual auth check happens client-side via the auth provider
  // This middleware just ensures the basic routing works
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|uploads).*)',
  ],
};
