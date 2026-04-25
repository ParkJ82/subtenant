import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/security';

export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  // Routes fully open to unauthenticated requests (read-only browsing)
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/find-tenants',
    '/find-subleases',
    '/api/auth/login',
    '/api/auth/register',
    '/api/amenities',
  ];

  // These API paths allow GET without auth; mutating methods require a token
  // (the route handlers themselves reject unauthenticated mutations)
  const publicGetPaths = ['/api/tenants', '/api/rooms'];

  const pathname = request.nextUrl.pathname;
  const method = request.method;

  const isPublicPath = publicPaths.some(path =>
    pathname.startsWith(path) || pathname === path
  );

  const isPublicGet =
    method === 'GET' &&
    publicGetPaths.some(path => pathname.startsWith(path));

  if (isPublicPath || isPublicGet) {
    return NextResponse.next();
  }

  // Check for token on protected routes
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Add user info to request headers
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId.toString());
  response.headers.set('x-user-email', payload.email);

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/profile/:path*',
    '/create-listing/:path*',
  ],
};
