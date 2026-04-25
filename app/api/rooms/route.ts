import { NextRequest, NextResponse } from 'next/server';
import { roomApi } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('location') || undefined;
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : undefined;
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined;
    const availableFrom = searchParams.get('availableFrom') || undefined;
    const availableTo = searchParams.get('availableTo') || undefined;
    const propertyType = searchParams.get('propertyType') || undefined;
    const amenityIDs = searchParams.get('amenityIDs')
      ? searchParams.get('amenityIDs')!.split(',').map(Number)
      : undefined;

    const rooms = await roomApi.getAll({
      location,
      minPrice,
      maxPrice,
      availableFrom,
      availableTo,
      propertyType,
      amenityIDs,
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const room = await roomApi.create(body, userId);
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
