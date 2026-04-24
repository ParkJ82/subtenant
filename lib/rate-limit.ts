import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max 100 requests per window

export function rateLimitMiddleware(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimit.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

// Stricter rate limiting for auth endpoints
const authRateLimit = new Map<string, { count: number; resetTime: number }>();
const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_AUTH_REQUESTS = 5; // Max 5 auth attempts per window

export function authRateLimitMiddleware(identifier: string): boolean {
  const now = Date.now();
  const record = authRateLimit.get(identifier);

  if (!record || now > record.resetTime) {
    authRateLimit.set(identifier, {
      count: 1,
      resetTime: now + AUTH_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= MAX_AUTH_REQUESTS) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

// Get client identifier from request
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key);
    }
  }
  for (const [key, value] of authRateLimit.entries()) {
    if (now > value.resetTime) {
      authRateLimit.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute
