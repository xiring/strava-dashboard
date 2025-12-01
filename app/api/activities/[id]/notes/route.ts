import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getValidAccessToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notes, tags } = await request.json();
    const activityId = params.id;

    // Update activity notes and tags using raw SQL to avoid type issues
    const tagsJson = tags && tags.length > 0 ? JSON.stringify(tags) : null;
    await prisma.$executeRawUnsafe(
      `UPDATE activities 
       SET notes = ?, 
           tags = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      notes || null,
      tagsJson,
      activityId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating activity notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notes' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activityId = params.id;
    
    // Use raw SQL to fetch notes and tags to avoid type issues
    const result = await prisma.$queryRawUnsafe<Array<{ notes: string | null; tags: string | null }>>(
      `SELECT notes, tags FROM activities WHERE id = ?`,
      activityId
    );

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const activity = result[0];
    return NextResponse.json({
      notes: activity.notes || '',
      tags: activity.tags ? JSON.parse(activity.tags) : [],
    });
  } catch (error: any) {
    console.error('Error fetching activity notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}
