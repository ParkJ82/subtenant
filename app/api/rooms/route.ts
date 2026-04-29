import { NextRequest, NextResponse } from 'next/server';
import { roomApi } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Return the single room owned by this account (for profile "My Listing")
    const subleasorAccountID = searchParams.get('subleasorAccountID');
    if (subleasorAccountID) {
      const room = await roomApi.getByAccountId(parseInt(subleasorAccountID));
      return NextResponse.json(room ?? null);
    }

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
    const amenityIDs = searchParams.getAll('amenityIDs')
      ? searchParams.getAll('amenityIDs').map(Number)
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
  } catch (error: any) {
    if (error?.message === 'DUPLICATE_LISTING') {
      return NextResponse.json(
        { error: 'You already have a room listing. Each subleasor can only have one listing.' },
        { status: 409 }
      );
    }
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
