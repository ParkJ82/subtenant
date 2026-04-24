import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/security';

export function withAuth(handler: (request: NextRequest, userId: number) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }

    return handler(request, payload.userId);
  };
}

export function getUserIdFromRequest(request: NextRequest): number | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const payload = verifyToken(token);
  return payload?.userId || null;
}
