import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // In production, you would send this to your analytics service
    // For now, just log it
    console.log('[Performance Metric]', metric);

    // You could store this in a database or send to services like:
    // - Google Analytics
    // - Datadog
    // - New Relic
    // - Custom analytics endpoint

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording performance metric:', error);
    return NextResponse.json({ error: 'Failed to record metric' }, { status: 500 });
  }
}

