import { NextRequest, NextResponse } from 'next/server';
import { tenantApi } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('location') || undefined;
    const companyName = searchParams.get('companyName') || undefined;
    const availableFrom = searchParams.get('availableFrom') || undefined;
    const availableTo = searchParams.get('availableTo') || undefined;

    const tenants = await tenantApi.getAll({
      location,
      companyName,
      availableFrom,
      availableTo,
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await tenantApi.create(body);
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
