import { NextRequest, NextResponse } from 'next/server';
import { applicationApi, contractApi } from '@/lib/api';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await applicationApi.updateStatus(parseInt(id), status);

    // When accepted, auto-create a contract using the application's room data
    let contract = null;
    if (status === 'accepted') {
      contract = await contractApi.createFromApplication(parseInt(id));
    }

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
