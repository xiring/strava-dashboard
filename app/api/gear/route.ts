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

    // Fetch gear using raw SQL
    const gear = await prisma.$queryRawUnsafe<Array<{
      id: string;
      name: string;
      type: string;
      brand: string | null;
      model: string | null;
      distance: number;
      purchase_date: string | null;
      purchase_price: number | null;
      notes: string | null;
      athlete_id: number;
      is_active: boolean;
    }>>(
      `SELECT * FROM gear WHERE athlete_id = ? ORDER BY name`,
      athleteId
    );

    return NextResponse.json(gear);
  } catch (error: any) {
    console.error('Error fetching gear:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gear' },
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

    // Create gear using raw SQL
    const gearId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO gear (id, name, type, brand, model, distance, purchase_date, purchase_price, notes, athlete_id, is_active, createdAt, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      gearId,
      body.name,
      body.type || 'bike',
      body.brand || null,
      body.model || null,
      body.distance || 0,
      body.purchase_date || null,
      body.purchase_price || null,
      body.notes || null,
      athleteId,
      body.is_active !== false
    );

    const newGear = await prisma.$queryRawUnsafe<Array<any>>(
      `SELECT * FROM gear WHERE id = ?`,
      gearId
    );

    return NextResponse.json(newGear[0]);
  } catch (error: any) {
    console.error('Error creating gear:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create gear' },
      { status: 500 }
    );
  }
}

