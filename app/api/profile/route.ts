import { NextRequest, NextResponse } from 'next/server';
import { accountApi, tenantApi } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const account = await accountApi.getById(userId);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const tenant = await tenantApi.getByAccountId(userId);

    const { password: _pw, ...accountWithoutPassword } = account;
    return NextResponse.json({ account: accountWithoutPassword, tenant });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, bio, dateOfBirth, phoneNumber, tenant: tenantData } = body;

    // Update Account fields
    await accountApi.update(userId, { name, bio, dateOfBirth, phoneNumber });

    // Update Tenant if the user has one and tenant fields were sent
    if (tenantData) {
      const tenant = await tenantApi.getByAccountId(userId);
      if (tenant) {
        await tenantApi.update(tenant.tenantID, tenantData);
      }
    }

    // Return the freshly-read data so the client stays in sync
    const updatedAccount = await accountApi.getById(userId);
    const updatedTenant = await tenantApi.getByAccountId(userId);

    const { password: _pw, ...accountWithoutPassword } = updatedAccount;
    return NextResponse.json({ account: accountWithoutPassword, tenant: updatedTenant });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
