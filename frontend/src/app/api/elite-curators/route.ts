import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/elite-curators?user_id=... - Get all elite curators for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  
  try {
    const user = await db.user.findUnique({ where: { id: user_id } });
    if (!user) return NextResponse.json({ eliteCurators: [], count: 0, eliteCuratorIds: [] });
    
    // Use the relationship table directly
    const eliteCurators = await db.$queryRaw<any[]>`
      SELECT ec.* FROM elite_curators ec
      INNER JOIN "_UserToelite_curators" utc ON ec.id = utc."B"
      WHERE utc."A" = ${user.id}
    `;
    
    const count = eliteCurators.length;
    const eliteCuratorIds = eliteCurators.map((ec: any) => ec.id);
    
    return NextResponse.json({ 
      eliteCurators, 
      count, 
      eliteCuratorIds 
    });
  } catch (error) {
    console.error('Error fetching elite curators:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch elite curators',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/elite-curators - Add elite curators to user
export async function POST(req: NextRequest) {
  const { user_id, elite_curator_ids } = await req.json();
  
  if (!user_id || !elite_curator_ids || !Array.isArray(elite_curator_ids)) {
    return NextResponse.json({ 
      error: 'user_id and elite_curator_ids array are required' 
    }, { status: 400 });
  }
  
  try {
    const user = await db.user.findUnique({ where: { id: String(user_id) } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Connect user to elite curators using raw query
    for (const eliteId of elite_curator_ids) {
      await db.$executeRaw`
        INSERT INTO "_UserToelite_curators" ("A", "B") 
        VALUES (${String(user_id)}, ${parseInt(eliteId)})
        ON CONFLICT DO NOTHING
      `;
    }
    
    // Get updated count
    const eliteCurators = await db.$queryRaw<any[]>`
      SELECT ec.* FROM elite_curators ec
      INNER JOIN "_UserToelite_curators" utc ON ec.id = utc."B"
      WHERE utc."A" = ${String(user_id)}
    `;
    
    const count = eliteCurators.length;
    const eliteCuratorIds = eliteCurators.map((ec: any) => ec.id);
    
    return NextResponse.json({ 
      eliteCurators,
      count,
      eliteCuratorIds,
      message: 'Elite curators added successfully'
    });
  } catch (error) {
    console.error('Error adding elite curators:', error);
    return NextResponse.json({ error: 'Failed to add elite curators' }, { status: 500 });
  }
}
