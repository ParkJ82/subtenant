import { NextRequest, NextResponse } from 'next/server';
import { applicationApi, tenantApi } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantID = searchParams.get('tenantID');
    const roomID = searchParams.get('roomID');

    if (tenantID) {
      const applications = await applicationApi.getByTenantIdWithDetails(parseInt(tenantID));
      return NextResponse.json(applications);
    }
    if (roomID) {
      const applications = await applicationApi.getByRoomId(parseInt(roomID));
      return NextResponse.json(applications);
    }

    return NextResponse.json(
      { error: 'tenantID or roomID query param required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
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
    const { roomID, message } = body;

    if (!roomID) {
      return NextResponse.json({ error: 'roomID is required' }, { status: 400 });
    }

    // Resolve tenantID from the authenticated user's accountID
    const tenant = await tenantApi.getByAccountId(userId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'You must create a tenant profile before applying' },
        { status: 400 }
      );
    }

    const application = await applicationApi.create(tenant.tenantID, parseInt(roomID), message);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
