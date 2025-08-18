import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/elite-curators/process - Background processing on user login
export async function POST(req: NextRequest) {
  const { user_id } = await req.json();
  
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  
  try {
    const user = await db.user.findUnique({ 
      where: { id: user_id }
    });
    
    console.log('Found user:', user);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.twitterId) {
      return NextResponse.json({ error: 'User has no Twitter ID' }, { status: 404 });
    }
    
    // Use the old working logic - fetch from Twitter API
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
    const followersResponse = await fetch(
      `${API_BASE}/twitter/followers?username=${user.twitterId}&followers=${user.followersCount || 5000}`
    );
    
    if (!followersResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
    }
    
    const followersData = await followersResponse.json();
    const userFollowers = followersData.followers || [];
    
    // Get all elite curators from database (same as old logic)
    const allEliteCurators = await db.eliteCurator.findMany();
    const eliteUsernames = new Set(allEliteCurators.map(ec => ec.username));
    
    // Find elite curators among user's followers (same as old logic)
    const foundEliteCurators = userFollowers.filter((follower: { username: string }) => 
      eliteUsernames.has(follower.username)
    );
    
    // Get elite curator IDs for matches (same as old logic)
    const foundEliteCuratorIds = allEliteCurators
      .filter(ec => foundEliteCurators.some((f: { username: string }) => f.username === ec.username))
      .map(ec => ec.id);
    
               // Connect elite curators to user (this will handle duplicates automatically)
           if (foundEliteCuratorIds.length > 0) {
             // Connect elite curators to user using raw query
             for (const eliteId of foundEliteCuratorIds) {
               await db.$executeRaw`
                 INSERT INTO "_UserToelite_curators" ("A", "B") 
                 VALUES (${String(user_id)}, ${eliteId})
                 ON CONFLICT DO NOTHING
               `;
             }
           }
           
                        // Get final count using raw query
             const eliteCurators = await db.$queryRaw<any[]>`
               SELECT ec.* FROM elite_curators ec
               INNER JOIN "_UserToelite_curators" utc ON ec.id = utc."B"
               WHERE utc."A" = ${String(user_id)}
             `;
             
             const count = eliteCurators.length;
             const finalEliteCuratorIds = eliteCurators.map((ec: any) => ec.id);
    
    return NextResponse.json({
      count,
      eliteCuratorIds: finalEliteCuratorIds,
      processedFollowers: userFollowers.length,
      foundEliteCurators: foundEliteCurators.length,
      message: `Processing completed. Found ${foundEliteCurators.length} elite curators among ${userFollowers.length} followers.`
    });
    
  } catch (error) {
    console.error('Error processing elite curators:', error);
    return NextResponse.json({ 
      error: 'Failed to process elite curators',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
