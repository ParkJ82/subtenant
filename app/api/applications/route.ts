import { NextRequest, NextResponse } from 'next/server';
import { applicationApi, tenantApi } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/api-auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    // Auth-gated helpers
    if (type === 'sent' || type === 'received' || type === 'check') {
      const userId = getUserIdFromRequest(request);
      if (!userId) {
        // 'check' is a soft check — unauthenticated users simply have no application
        if (type === 'check') return NextResponse.json(null);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (type === 'sent') {
        const tenant = await tenantApi.getByAccountId(userId);
        if (!tenant) return NextResponse.json([]);
        const apps = await applicationApi.getByTenantIdWithDetails(tenant.tenantID);
        return NextResponse.json(apps);
      }

      if (type === 'received') {
        const apps = await applicationApi.getReceivedByAccountId(userId);
        return NextResponse.json(apps);
      }

      // type === 'check': returns { applicationID, status } or null for this (tenant, room) pair
      const roomIDParam = searchParams.get('roomID');
      if (!roomIDParam) {
        return NextResponse.json({ error: 'roomID required for type=check' }, { status: 400 });
      }
      const tenant = await tenantApi.getByAccountId(userId);
      if (!tenant) return NextResponse.json(null);
      const existing = await applicationApi.getByTenantAndRoom(tenant.tenantID, parseInt(roomIDParam));
      return NextResponse.json(existing);
    }

    // Legacy params kept for backward compatibility
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
      { error: 'type, tenantID, or roomID query param required' },
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

    // Prevent applying to your own listing
    const ownerRows = await query(
      `SELECT s.accountID FROM RoomInfo r
       JOIN Subleasor s ON r.subleasorID = s.subleasorID
       WHERE r.roomID = ?`,
      [parseInt(roomID)]
    ) as any[];

    if (ownerRows.length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (ownerRows[0].accountID === userId) {
      return NextResponse.json(
        { error: 'You cannot apply to your own listing' },
        { status: 403 }
      );
    }

    // Resolve tenantID from the authenticated user's accountID
    const tenant = await tenantApi.getByAccountId(userId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'You must create a tenant profile before applying' },
        { status: 400 }
      );
    }

    // Prevent duplicate / re-apply after rejection
    const existing = await applicationApi.getByTenantAndRoom(tenant.tenantID, parseInt(roomID));
    if (existing) {
      const messages: Record<string, string> = {
        pending:  'You have already applied to this listing',
        accepted: 'You have already been accepted for this listing',
        rejected: 'You have already been rejected for this listing. You cannot re-apply.',
      };
      return NextResponse.json(
        { error: messages[existing.status] ?? 'You already have an application for this listing' },
        { status: 409 }
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
