import { NextRequest, NextResponse } from 'next/server';
import { tenantApi } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const tenant = await tenantApi.getById(parseInt(id));
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const success = await tenantApi.update(parseInt(id), body);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update tenant' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const success = await tenantApi.delete(parseInt(id));
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
