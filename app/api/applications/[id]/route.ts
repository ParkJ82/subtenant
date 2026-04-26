import { NextRequest, NextResponse } from 'next/server';
import { applicationApi, contractApi } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/api-auth';

type RouteContext = { params: Promise<{ id: string }> };

// Accept or reject an application (subleasor only)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const applicationID = parseInt(id);

  try {
    const body = await request.json();
    const { status } = body;

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'accepted' or 'rejected'" },
        { status: 400 }
      );
    }

    const info = await applicationApi.getOwnershipInfo(applicationID);
    if (!info) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (info.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending applications can be accepted or rejected' },
        { status: 409 }
      );
    }
    if (info.subleasorAccountID !== userId) {
      return NextResponse.json(
        { error: 'Only the room owner can accept or reject applications' },
        { status: 403 }
      );
    }

    await applicationApi.updateStatus(applicationID, status);

    let contract = null;
    if (status === 'accepted') {
      contract = await contractApi.createFromApplication(applicationID);
    }

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

// Withdraw an application (applicant/tenant only)
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const applicationID = parseInt(id);

  try {
    const info = await applicationApi.getOwnershipInfo(applicationID);
    if (!info) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (info.status === 'rejected') {
      return NextResponse.json(
        { error: 'Rejected applications cannot be deleted' },
        { status: 403 }
      );
    }
    if (info.status === 'accepted') {
      return NextResponse.json(
        { error: 'Accepted applications cannot be deleted' },
        { status: 403 }
      );
    }
    if (info.tenantAccountID !== userId) {
      return NextResponse.json(
        { error: 'Only the applicant can withdraw an application' },
        { status: 403 }
      );
    }

    await applicationApi.delete(applicationID);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return NextResponse.json({ error: 'Failed to withdraw application' }, { status: 500 });
  }
}
