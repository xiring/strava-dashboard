import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncService } from '@/lib/sync';
import { processChatQuery } from '@/lib/chatAgent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let activities = await db.getActivities(500, 0);
    if (activities.length === 0) {
      try {
        await syncService.syncActivities(200, false);
        activities = await db.getActivities(500, 0);
      } catch {
        // Continue with empty - sync may fail if not authenticated
      }
    }
    const response = processChatQuery(message, activities);

    return NextResponse.json({ message: response });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    );
  }
}
