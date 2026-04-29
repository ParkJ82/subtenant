import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/api-auth';
import { subleasorApi } from '@/lib/api';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get subleasor ID from account ID
    const subleasor = await subleasorApi.getByAccountId(userId);
    if (!subleasor) {
      return NextResponse.json({ count: 0 });
    }

    // Call the database function
    const result = await query(
      'SELECT count_incoming_applications_by_subleasor(?) AS incomingCount',
      [subleasor.subleasorID]
    ) as any[];

    return NextResponse.json({ count: result[0]?.incomingCount || 0 });
  } catch (error) {
    console.error('Error fetching incoming applications count:', error);
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
}
