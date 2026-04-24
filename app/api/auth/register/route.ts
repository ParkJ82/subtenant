import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, sanitizeInput, validateEmail, validatePassword } from '@/lib/security';
import { getClientIdentifier, authRateLimitMiddleware } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);

  // Apply rate limiting
  if (!authRateLimitMiddleware(clientId)) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, bio, dateOfBirth, phoneNumber } = body;

    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    if (!validateEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT accountID FROM Account WHERE email = ?',
      [sanitizedEmail]
    ) as any[];

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create account
    const result = await query(
      `INSERT INTO Account (name, email, password, bio, dateOfBirth, phoneNumber)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sanitizedName,
        sanitizedEmail,
        hashedPassword,
        bio || null,
        dateOfBirth || null,
        phoneNumber || null,
      ]
    ) as any;

    const accountID = result.insertId;

    // Return user data (without password)
    const user = {
      accountID,
      name: sanitizedName,
      email: sanitizedEmail,
      bio: bio || null,
      dateOfBirth: dateOfBirth || null,
      phoneNumber: phoneNumber || null,
    };

    return NextResponse.json(
      { message: 'Account created successfully', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
