import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }
    const neighbors = await db.getActivityNeighbors(id);
    return NextResponse.json(neighbors);
  } catch (error: any) {
    console.error('Error fetching neighbors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch neighbors' },
      { status: 500 }
    );
  }
}
