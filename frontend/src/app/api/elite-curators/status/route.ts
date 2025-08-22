import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/elite-curators/status?user_id=... - Check if user has been processed
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  
  try {
    // Check if user has any elite curators in the database
    const eliteCurators = await db.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "_UserToelite_curators" 
      WHERE "A" = ${user_id}
    `;
    
    const hasBeenProcessed = eliteCurators[0]?.count > 0;
    
    return NextResponse.json({ 
      hasBeenProcessed,
      message: hasBeenProcessed ? 'User has been processed' : 'User has not been processed yet'
    });
  } catch (error) {
    console.error('Error checking elite curators status:', error);
    return NextResponse.json({ 
      error: 'Failed to check elite curators status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
