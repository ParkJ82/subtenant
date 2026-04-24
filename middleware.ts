import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/security';

export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  // Public routes that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/find-tenants',
    '/find-subleases',
    '/api/auth/login',
    '/api/auth/register',
    '/api/tenants',
    '/api/rooms',
    '/api/amenities',
  ];

  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path) ||
    request.nextUrl.pathname === path
  );

  // Allow public paths
  if (isPublicPath) {
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
