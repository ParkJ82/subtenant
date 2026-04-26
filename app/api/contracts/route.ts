import { NextRequest, NextResponse } from 'next/server';
import { contractApi } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contracts = await contractApi.getAllForUser(userId);
    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}
