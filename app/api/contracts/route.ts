import { NextRequest, NextResponse } from 'next/server';
import { contractApi } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantID = searchParams.get('tenantID');

    if (!tenantID) {
      return NextResponse.json({ error: 'tenantID query param required' }, { status: 400 });
    }

    const contracts = await contractApi.getByTenantIdWithDetails(parseInt(tenantID));
    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}
