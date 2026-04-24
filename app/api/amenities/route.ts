import { NextRequest, NextResponse } from 'next/server';
import { amenityApi } from '@/lib/api';

export async function GET() {
  try {
    const amenities = await amenityApi.getAll();
    return NextResponse.json(amenities);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}
