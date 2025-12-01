import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getValidAccessToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get athlete ID
    const athleteResponse = await fetch(`${request.nextUrl.origin}/api/athlete`);
    if (!athleteResponse.ok) {
      return NextResponse.json({ error: 'Failed to get athlete' }, { status: 500 });
    }
    const athleteData = await athleteResponse.json();
    const athleteId = athleteData.athlete?.id;

    if (!athleteId) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Fetch routes using raw SQL
    const routes = await prisma.$queryRawUnsafe<Array<{
      id: string;
      name: string;
      description: string | null;
      polyline: string;
      distance: number;
      elevation_gain: number | null;
      athlete_id: number;
      is_public: boolean;
      is_favorite: boolean;
      createdAt: string;
      updated_at: string;
    }>>(
      `SELECT * FROM routes WHERE athlete_id = ? ORDER BY is_favorite DESC, name`,
      athleteId
    );

    return NextResponse.json(routes);
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Get athlete ID
    const athleteResponse = await fetch(`${request.nextUrl.origin}/api/athlete`);
    if (!athleteResponse.ok) {
      return NextResponse.json({ error: 'Failed to get athlete' }, { status: 500 });
    }
    const athleteData = await athleteResponse.json();
    const athleteId = athleteData.athlete?.id;

    if (!athleteId) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Create route using raw SQL
    const routeId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO routes (id, name, description, polyline, distance, elevation_gain, athlete_id, is_public, is_favorite, createdAt, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      routeId,
      body.name,
      body.description || null,
      body.polyline || '',
      body.distance,
      body.elevation_gain || null,
      athleteId,
      body.is_public || false,
      body.is_favorite || false
    );

    const newRoute = await prisma.$queryRawUnsafe<Array<any>>(
      `SELECT * FROM routes WHERE id = ?`,
      routeId
    );

    return NextResponse.json(newRoute[0]);
  } catch (error: any) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create route' },
      { status: 500 }
    );
  }
}

