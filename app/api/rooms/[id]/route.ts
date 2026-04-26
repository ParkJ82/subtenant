import { NextRequest, NextResponse } from 'next/server';
import { roomApi } from '@/lib/api';
import { getUserIdFromRequest } from '@/lib/api-auth';
import { query } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

/** Returns { suiteID, propertyID, ownerAccountID } or null if not found. */
async function getRoomMeta(roomID: number) {
  const rows = await query(`
    SELECT r.suiteID, s.propertyID, sub.accountID AS ownerAccountID
    FROM RoomInfo r
    JOIN SuiteInfo s   ON r.suiteID    = s.suiteID
    JOIN Subleasor sub ON r.subleasorID = sub.subleasorID
    WHERE r.roomID = ?
  `, [roomID]) as any[];
  return rows[0] ?? null;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const room = await roomApi.getById(parseInt(id));
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const body = await request.json();
    const success = await roomApi.update(parseInt(id), body);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update room' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

// Toggle isListed — only the room owner can call this
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const roomID = parseInt(id);

  try {
    const meta = await getRoomMeta(roomID);
    if (!meta) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (meta.ownerAccountID !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { isListed } = body;

    if (typeof isListed !== 'boolean') {
      return NextResponse.json({ error: 'isListed (boolean) is required' }, { status: 400 });
    }

    // Block re-listing while an active contract exists
    if (isListed === true) {
      const activeContract = await query(
        `SELECT c.contractID FROM Contract c
         JOIN Application a ON c.applicationID = a.applicationID
         WHERE a.roomID = ? AND a.status = 'accepted' AND c.leaseEnd >= CURDATE()`,
        [roomID]
      ) as any[];
      if (activeContract.length > 0) {
        return NextResponse.json(
          { error: 'This listing has an active contract and cannot be re-listed' },
          { status: 403 }
        );
      }
    }

    await query('UPDATE RoomInfo SET isListed = ? WHERE roomID = ?', [isListed ? 1 : 0, roomID]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling isListed:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

// Hard-delete a listing and all its dependent rows — only the room owner can call this
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const roomID = parseInt(id);

  try {
    const meta = await getRoomMeta(roomID);
    if (!meta) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (meta.ownerAccountID !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Block deletion while an active contract exists
    const activeContract = await query(
      `SELECT c.contractID FROM Contract c
       JOIN Application a ON c.applicationID = a.applicationID
       WHERE a.roomID = ? AND a.status = 'accepted' AND c.leaseEnd >= CURDATE()`,
      [roomID]
    ) as any[];
    if (activeContract.length > 0) {
      return NextResponse.json(
        { error: 'This listing has an active contract and cannot be deleted' },
        { status: 403 }
      );
    }

    const { suiteID, propertyID } = meta;

    // Cascade delete in FK-safe order
    await query('DELETE FROM Contract     WHERE roomID = ?', [roomID]);
    await query('DELETE FROM Application  WHERE roomID = ?', [roomID]);
    await query('DELETE FROM RoomAmenity  WHERE roomID = ?', [roomID]);
    await query('DELETE FROM ListingVideo WHERE roomID = ?', [roomID]);
    await query('DELETE FROM RoomInfo     WHERE roomID = ?', [roomID]);
    await query('DELETE FROM SuiteInfo    WHERE suiteID = ?', [suiteID]);
    await query('DELETE FROM Property     WHERE propertyID = ?', [propertyID]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
