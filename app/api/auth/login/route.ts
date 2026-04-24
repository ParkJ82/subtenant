import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, generateToken, sanitizeInput } from '@/lib/security';
import { getClientIdentifier, authRateLimitMiddleware } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);

  // Apply rate limiting
  if (!authRateLimitMiddleware(clientId)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    // Get user by email
    const users = await query(
      'SELECT accountID, name, email, password, bio, dateOfBirth, phoneNumber FROM Account WHERE email = ?',
      [sanitizedEmail]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.accountID,
      email: user.email,
    });

    // Return user data (without password) and token
    const userData = {
      accountID: user.accountID,
      name: user.name,
      email: user.email,
      bio: user.bio,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
    };

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
